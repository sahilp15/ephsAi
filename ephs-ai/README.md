# EPHS AI

A production-minded course-planning platform for **Eden Prairie High School**
students, grounded exclusively in the official **EPHS Course Guide 2026-27**.

Students can browse and search all 269 structured courses, build a four-year
plan on EPHS's four-term calendar, check class-year-specific graduation rules,
explore the five official Pathways, and ask an AI advisor for recommendations —
every one of which is a real EPHS course with page-level citations.

## Principles

1. **Source of truth.** Every course fact shown comes from
   `data/ephs-course-guide-2026-27.json` (extracted from the official PDF,
   SHA-256 pinned). Fields the guide doesn't provide are omitted or labeled as
   requiring counselor verification — never fabricated.
2. **Deterministic authority.** A pure rules engine (eligibility, plan
   validation, graduation rules) is the authority. The AI explains; it never
   overrides.
3. **Useful without AI.** With no API key the app is fully functional; the
   recommender runs in deterministic **Smart match mode**.
4. **Privacy-first.** Student plans live in the student's browser in this MVP.
   AI requests carry anonymized planning context only. The production path is
   Supabase Auth + Postgres with row-level security.

## Local setup

```bash
npm install
npm run dev            # http://localhost:3000 — works with zero configuration
```

Optional configuration (`cp .env.example .env.local`):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables AI recommendations (server-only; never sent to the browser). Without it, Smart match mode is used. |
| `OPENAI_MODEL` | Model override. Defaults to `gpt-4o-mini`. |
| `AI_RATE_LIMIT_PER_HOUR` | Per-IP hourly cap on the AI endpoint (default 20). |
| `DEMO_MODE` | `true` (default) seeds three fictional demo students in the counselor view. |
| `APP_URL` | Public URL of the deployment. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Production persistence path (optional — see below). |

Environment variables are validated with a typed Zod schema at first use
(`lib/env.ts`).

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint (next/core-web-vitals)
npm run typecheck    # TypeScript strict mode, no emit
npm run test         # Vitest unit tests (domain engine + AI guards)
npm run data:audit   # validate the dataset and regenerate docs/DATA_AUDIT.md
npm run data:import  # idempotent import into Supabase (requires service key)
```

## AI recommendations — how grounding works

`POST /api/recommend` (see `lib/ai/pipeline.ts`):

1. Zod-validates the request; rate-limits per IP.
2. Builds a **candidate set** deterministically (grade eligibility, interest
   and query relevance, pathway alignment, rigor fit) — never the whole guide.
3. Computes engine eligibility for every candidate **before** the model runs.
4. Calls OpenAI (JSON mode, server-only key) with hard grounding rules; the
   student message and catalog text are delimited as untrusted data.
5. Zod-validates the output; **rejects any course ID outside the candidate
   set**; re-applies engine eligibility (the model can never upgrade it);
   restricts citations to each course's real source pages.
6. On any failure — no key, timeout, invalid output — returns deterministic
   **Smart match mode** results, clearly labeled.

## Supabase production path (optional)

The MVP serves the catalog from the versioned dataset and keeps student data
in the browser. To move to hosted Postgres + Auth + RLS:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` (Supabase SQL editor or CLI).
3. Set the Supabase env vars in `.env.local` (service-role key is used only by
   the server-side import script).
4. `npm run data:import` — idempotent, versioned by the source PDF's SHA-256,
   with explicit activation. Keeps older guide versions for audit.
5. Enable Google OAuth in Supabase Auth; restrict to district accounts when
   the district is ready.

See `docs/DATA_IMPORT_PLAN.md` and `docs/SECURITY_AND_PRIVACY.md`.

## Demo mode

`DEMO_MODE=true` (default) exposes `/counselor` with three clearly fictional
students (engineering, business, communication & arts) — each with completed
courses, a partial plan, eligibility warnings, and counselor-verification
items. "Explore as this student" loads a demo profile into your browser.
The full walkthrough is in `docs/DEMO_SCRIPT.md`.

## Logo replacement

Drop the official EPHS AI logo into `public/branding/` and follow the comment
in `components/EPHSLogo.tsx` (single replacement point). Until then the app
uses an accessible text-only "EPHS AI" mark. Never redraw, recolor, stretch,
or substitute a generated logo.

## Deployment (Vercel)

1. Import the repository in Vercel; set the project root to `ephs-ai/`.
2. Add env vars (`OPENAI_API_KEY` at minimum for AI mode).
3. Deploy — no database required for the MVP.

## Known limitations

From the dataset itself (surfaced in-app on `/admin`):

- The guide provides no course numbers, seat counts, teacher/period
  assignments, or per-term offerings — the app never displays or invents them.
- The guide has no complete numerical graduation credit table; the
  requirements page reports *verified satisfied / verified open / needs
  counselor confirmation* instead of a fake percentage.
- Pathway page markers (`*`, `**`, `TC`, `•`, `@`) are preserved verbatim;
  meanings not defined in the guide are not invented.
- GPA projections are intentionally not implemented — no official EPHS
  GPA/weighting policy is included in the guide (see the note in
  `lib/domain/graduation-rules.ts`).
- Cross-listed courses keep every source appearance; conflicts are shown, not
  silently resolved.

## Documentation

- `docs/IMPLEMENTATION_PLAN.md` — phases, status, decisions
- `docs/ARCHITECTURE.md` — system design
- `docs/DATA_IMPORT_PLAN.md` — dataset lifecycle and Supabase import
- `docs/DATA_AUDIT.md` — generated dataset integrity report
- `docs/SECURITY_AND_PRIVACY.md` — security model and student-privacy policy
- `docs/DEMO_SCRIPT.md` — leadership demo walkthrough
