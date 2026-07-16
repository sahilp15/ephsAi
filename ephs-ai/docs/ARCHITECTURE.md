# Architecture

## Overview

EPHS AI is a Next.js (App Router) application with three clean layers:

```
┌─────────────────────────────────────────────────────────────┐
│ UI (app/, components/)                                      │
│  Server components for catalog/pathways/admin;              │
│  client components for planner, onboarding, recommender     │
├─────────────────────────────────────────────────────────────┤
│ Domain engine (lib/domain/) — pure, deterministic, tested   │
│  prerequisites · eligibility · plan-validation ·            │
│  graduation-rules · pathways · smart-match · term-span      │
├─────────────────────────────────────────────────────────────┤
│ Data (lib/catalog/) + AI (lib/ai/)                          │
│  Versioned dataset store, search, meta; provider-abstracted │
│  OpenAI pipeline with deterministic post-validation         │
└─────────────────────────────────────────────────────────────┘
```

## Source of truth

`data/ephs-course-guide-2026-27.json` — extracted from the official PDF
(SHA-256 pinned in the file and surfaced on `/admin`). `lib/catalog/store.ts`
loads and indexes it once per server process (~3 MB read-only, shared across
requests — comfortably serves thousands of students). The 2.3 MB dataset never
ships to the browser; clients receive:

- **Paginated search results** (server-rendered `/courses`).
- **Compact planner metadata** (`/api/catalog/planner-meta`, ~270 records with
  parsed prerequisites and term spans) used for client-side plan validation.

## Deterministic domain engine

All modules in `lib/domain/` are pure functions with no I/O, imported by both
server and client code, and unit-tested:

- `prerequisites.ts` — conservative parser: structured matching only when
  every referenced name resolves exactly to a catalog course; teacher
  recommendations / applications / auditions / GPA / concurrent enrollment →
  `manual`; anything ambiguous → `unknown`. Raw wording is always displayed.
- `eligibility.ts` — the single authority for eligibility labels
  (`eligible`, `not_eligible_grade`, `missing_prerequisite`,
  `prerequisite_unknown`, `counselor_verification_required`).
- `plan-validation.ts` — grade eligibility, plan-order prerequisite checks,
  duplicates, multi-term overflow, unknown-scheduling notices. It deliberately
  does *not* claim same-term conflicts (the guide has no period data).
- `graduation-rules.ts` — Class of 2027 vs 2028+ rules, arts requirement,
  honest three-bucket reporting. GPA projection intentionally unimplemented
  (no official policy in the guide).
- `smart-match.ts` — deterministic recommender used as the AI fallback and
  as the candidate-ranking stage of the AI pipeline.

## AI pipeline (`lib/ai/`)

- `provider.ts` — vendor-neutral interface; `openai-provider.ts` is the only
  OpenAI-specific file, so the model vendor can be swapped in one place.
- `prompt.ts` — hard grounding rules; student message and catalog text are
  delimited as untrusted data (prompt-injection defense).
- `validate.ts` — pure post-validation: Zod parse, hallucinated-ID rejection,
  engine eligibility re-applied, citations restricted to real source pages.
- `pipeline.ts` — orchestration + Smart match fallback.
- `rate-limit.ts` — per-IP fixed-window limiter (swap for a shared store when
  multi-region).

Defense in depth: even a successful prompt injection cannot fabricate a
course, upgrade eligibility, or forge a citation, because those guarantees are
enforced deterministically after the model responds.

## State & persistence

MVP: student profile and plan persist in the student's browser
(`lib/client/student-context.tsx`, localStorage) — privacy-first, zero-config,
deployable anywhere. Demo students are server-seeded fixtures.

Production path: Supabase Auth (Google OAuth, district-restrictable) +
Postgres with row-level security. `supabase/migrations/0001_initial_schema.sql`
defines catalog versioning, profiles, plans, history, recommendation sessions,
feedback, and audit tables with owner/counselor/admin policies;
`scripts/data-import.mjs` performs the idempotent versioned import. The client
store is a thin interface, so swapping localStorage for Supabase queries does
not touch the domain engine or UI structure.

## Performance

- Server-side pagination and in-memory indexed search (mirrors the Postgres
  tsvector/trigram indexes in the migration for the hosted path).
- Static generation for course/pathway detail pages (`generateStaticParams`).
- Planner metadata cached client-side after one fetch; HTTP cache headers set.
- AI endpoint: rate-limited, 30 s provider timeout, aborts with client
  disconnect, small payloads (≤24 compact candidates), latency logging.
