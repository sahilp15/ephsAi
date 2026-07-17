# Implementation Plan & Status

Living document - updated as the project develops.

## Product decisions (locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| AI provider | **OpenAI** (`OPENAI_API_KEY`, default `gpt-4o-mini`) behind a vendor-neutral provider interface | Requested for this phase; one-file swap to any other vendor |
| Academic model | Four terms per year; semester = two consecutive terms | Matches the guide's EP Online definition |
| Source of truth | `data/ephs-course-guide-2026-27.json` only | Non-negotiable grounding rule |
| MVP persistence | Student data in the browser (localStorage); Supabase Postgres/Auth/RLS as the documented production path with migrations + import ready | Zero-config demo, privacy-first, no fake auth |
| Eligibility authority | Deterministic engine; AI can never upgrade a status | Conservative correctness |
| GPA projections | Not implemented | No official GPA/weighting policy in the guide |
| Pathway progress | "Aligned courses" only, never completion % | Guide defines no completion criteria |

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 - Repository & data audit | Dataset validation, counts, known limitations, branding tokens | ✅ Complete (`npm run data:audit` → `DATA_AUDIT.md`) |
| 1 - Foundation | Next.js 14 + TS strict + Tailwind tokens + lint/test config + design system + text-only logo fallback | ✅ Complete |
| 2 - Database & import | In-memory versioned catalog store (active path); Supabase migrations + idempotent import script (hosted path); search indexes both paths | ✅ Complete |
| 3 - Auth & roles | Demo mode (default, fictional students); Supabase Auth + RLS schema written and documented for production | ✅ MVP scope complete - live Supabase wiring is deferred until district credentials exist |
| 4 - Catalog | `/courses` list + filters + search + pagination; `/courses/[id]` detail with citations, cross-listing view, data-quality warnings | ✅ Complete |
| 5 - Planner & validation | `/plan` four-grade × four-term grid, add/move/remove, multi-term occupancy, deterministic validation, printable summary | ✅ Complete |
| 6 - Requirements & pathways | `/requirements` (2027 vs 2028+ rules, arts list, three honest buckets, current/projected toggle); `/pathways` + detail with markers preserved and alignment panel | ✅ Complete |
| 7 - AI recommender | Candidate retrieval → OpenAI JSON mode → Zod → ID rejection → engine re-validation → citations → Smart match fallback; rate limiting; history | ✅ Complete |
| 8 - Counselor & admin | `/counselor` demo-student review (read-only plan, warnings, notes, print); `/admin` data audit + guide-version display | ✅ Complete |
| 9 - Testing, polish, deployment | Vitest unit suite; lint/typecheck/test/build gates; docs; demo script | ✅ Unit + gates complete |

## Deferred items (explicitly out of MVP scope, with the path prepared)

- **Live Supabase wiring** (auth UI, server persistence): schema, RLS
  policies, and import are committed and documented; the client store is an
  interface designed for the swap. Deferred until the district provides a
  Supabase project / approved account domain.
- **Playwright end-to-end suite**: unit tests cover the domain engine and AI
  guards; e2e automation is the next quality investment (`npm run build` +
  route rendering are verified in CI-style locally).
- **Recommendation feedback capture UI** (thumbs up/down): schema table
  exists (`recommendation_feedback`); UI pending.
- **Counselor note editing**: displayed read-only in demo mode; write path
  arrives with Supabase auth.

## Quality gates

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` must all
pass before any release. Current status: all green (see repository CI/commits).
