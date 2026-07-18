# Architecture

## Overview

EPHS AI is a Next.js (App Router) application with three clean layers:

```
┌─────────────────────────────────────────────────────────────┐
│ UI (app/, components/)                                      │
│  Server components for catalog/pathways/admin;              │
│  client components for planner, onboarding, recommender     │
├─────────────────────────────────────────────────────────────┤
│ Domain engine (lib/domain/) - pure, deterministic, tested   │
│  prerequisites · eligibility · plan-validation ·            │
│  graduation-rules · pathways · smart-match · term-span      │
├─────────────────────────────────────────────────────────────┤
│ Data (lib/catalog/) + AI (lib/ai/)                          │
│  Versioned dataset store, search, meta; provider-abstracted │
│  OpenAI pipeline with deterministic post-validation         │
└─────────────────────────────────────────────────────────────┘
```

## Source of truth

`data/ephs-course-guide-2026-27.json` - extracted from the official PDF
(SHA-256 pinned in the file and surfaced on `/admin`). `lib/catalog/store.ts`
loads and indexes it once per server process (~3 MB read-only, shared across
requests - comfortably serves thousands of students). The 2.3 MB dataset never
ships to the browser; clients receive:

- **Paginated search results** (server-rendered `/courses`).
- **Compact planner metadata** (`/api/catalog/planner-meta`, ~270 records with
  parsed prerequisites and term spans) used for client-side plan validation.

## Deterministic domain engine

All modules in `lib/domain/` are pure functions with no I/O, imported by both
server and client code, and unit-tested:

- `prerequisites.ts` - conservative parser: structured matching only when
  every referenced name resolves exactly to a catalog course; teacher
  recommendations / applications / auditions / GPA / concurrent enrollment →
  `manual`; anything ambiguous → `unknown`. Raw wording is always displayed.
- `eligibility.ts` - the single authority for eligibility labels
  (`eligible`, `not_eligible_grade`, `missing_prerequisite`,
  `prerequisite_unknown`, `counselor_verification_required`).
- `plan-validation.ts` - grade eligibility, plan-order prerequisite checks,
  duplicates, multi-term overflow, unknown-scheduling notices. It deliberately
  does *not* claim same-term conflicts (the guide has no period data).
- `graduation-rules.ts` - Class of 2027 vs 2028+ rules, arts requirement,
  honest three-bucket reporting. GPA projection intentionally unimplemented
  (no official policy in the guide).
- `smart-match.ts` - deterministic recommender used as the AI fallback and
  as the candidate-ranking stage of the AI pipeline.

## AI pipeline (`lib/ai/`)

- `provider.ts` - vendor-neutral interface; `openai-provider.ts` is the only
  OpenAI-specific file, so the model vendor can be swapped in one place.
- `prompt.ts` - hard grounding rules; student message and catalog text are
  delimited as untrusted data (prompt-injection defense).
- `validate.ts` - pure post-validation: Zod parse, hallucinated-ID rejection,
  engine eligibility re-applied, citations restricted to real source pages.
- `pipeline.ts` - orchestration + Smart match fallback.
- `rate-limit.ts` - per-IP fixed-window limiter (swap for a shared store when
  multi-region).

Defense in depth: even a successful prompt injection cannot fabricate a
course, upgrade eligibility, or forge a citation, because those guarantees are
enforced deterministically after the model responds.

## Authentication, roles & sessions

Google-only OAuth via Supabase Auth. `lib/auth/rules.ts` is the pure,
unit-tested policy (normalize email → derive role from the approved student
domain, admin domain, and admin allowlist); `lib/auth/config.ts` resolves the
concrete rules from server-only env. `app/auth/callback` verifies the email
server-side and idempotently provisions a `profiles` row with the derived role
(`lib/auth/provision.ts`). `middleware.ts` refreshes the secure HTTP-only
session cookie and gates protected routes; `lib/auth/session.ts`
(`requireUser` / `requireStudent` / `requireAdmin`) re-checks on every protected
page, route handler, and server action; Postgres RLS enforces ownership at the
database. Selecting a login button never confers privilege - the role always
comes from the verified identity.

## State & persistence

Authenticated data lives in Supabase Postgres with row-level security:
`profiles`, `student_onboarding`, `transcripts` + `transcript_jobs` +
`transcript_extracted_rows`, `academic_records`, `academic_plans` +
`plan_entries` (with `locked` / `source` / `recommendation_reason`),
`course_equivalencies`, `admin_allowlist`, and `audit_events`. Migrations
`0001` (catalog + base) and `0002` (auth/transcripts/records/audit + private
storage bucket) define the schema and owner/admin policies;
`scripts/data-import.mjs` performs the idempotent versioned catalog import.

Data access is layered in `lib/data/*` (onboarding, academic, plan, graduation,
equivalencies, admin) behind the RLS client, with the service-role client used
only for trusted server work (transcript file download/processing, audit).
The domain engine consumes DB-derived inputs unchanged: confirmed
`academic_records` are projected (`lib/domain/academic-history.ts`) into the
completed-course ids and plan entries the existing planner, eligibility, and
graduation modules already expect.

The legacy browser store (`lib/client/student-context.tsx`) remains only for
the demo/counselor fixtures.

## Transcript pipeline

`app/api/transcript/*` handles upload (private storage, type/size validation),
processing, review, confirmation, and deletion. Extraction is provider-
abstracted (`lib/transcript/provider.ts`): a no-external-calls heuristic parser
(`lib/transcript/parse.ts`, unit-tested) or an OpenAI vision provider. Matching
(`lib/domain/transcript-match.ts`, unit-tested) proposes a catalog course with
an honest confidence level (high / possible / needs-review / none); admin-
managed equivalencies take priority and transfers stay identifiable. Nothing
enters academic history until the student explicitly confirms.

## Performance

- Server-side pagination and in-memory indexed search (mirrors the Postgres
  tsvector/trigram indexes in the migration for the hosted path).
- Static generation for course/pathway detail pages (`generateStaticParams`).
- Planner metadata cached client-side after one fetch; HTTP cache headers set.
- AI endpoint: rate-limited, 30 s provider timeout, aborts with client
  disconnect, small payloads (≤24 compact candidates), latency logging.
