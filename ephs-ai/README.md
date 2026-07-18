# EPHS AI

A production-minded course-planning platform for **Eden Prairie High School**
students, grounded exclusively in the official **EPHS Course Guide 2026-27**.

Students can browse and search all 269 structured courses, build a four-year
plan on EPHS's four-term calendar, check class-year-specific graduation rules,
explore the five official Pathways, and chat with the **EPHS AI Assistant**,
which answers only from the official guide with page-level citations.

## Principles

1. **Source of truth.** Every course fact shown comes from
   `data/ephs-course-guide-2026-27.json` (extracted from the official PDF,
   SHA-256 pinned). Fields the guide doesn't provide are omitted or labeled as
   requiring counselor verification - never fabricated.
2. **Deterministic authority.** A pure rules engine (eligibility, plan
   validation, graduation rules) is the authority. The AI explains; it never
   overrides.
3. **Useful without AI.** With no API key the app is fully functional; the
   assistant answers with deterministic catalog lookups.
4. **Privacy-first, secured server-side.** Google-only sign-in, role
   derivation, session handling, transcript storage, and every protected
   operation are enforced on the backend (Supabase Auth + Postgres with
   row-level security) - never by a frontend route guard alone. AI requests
   carry anonymized planning context only.

## Local setup

```bash
npm install
npm run dev            # http://localhost:3000 - works with zero configuration
```

Optional configuration (`cp .env.example .env.local`):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables the live AI assistant (server-only; never sent to the browser). Without it, deterministic catalog-lookup mode is used. |
| `OPENAI_MODEL` | Model override. Defaults to `gpt-4o`. |
| `AI_RATE_LIMIT_PER_HOUR` | Per-IP hourly cap on the AI endpoint (default 20). |
| `DEMO_MODE` | `true` (default) seeds three fictional demo students in the counselor view. |
| `APP_URL` | Public URL of the deployment. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Enable Google sign-in, accounts, transcripts, saved plans, admin (see below). |
| `STUDENT_EMAIL_DOMAIN` | Exact domain an approved student email must end with (default `ep-student.org`). |
| `ADMIN_EMAIL_DOMAIN` | Exact domain that confers admin access (default `edenpr.k12.mn.us`). |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated extra admin emails (default includes the temporary `sahil.parasharami@gmail.com` exception). |
| `TRANSCRIPT_BUCKET` / `TRANSCRIPT_EXTRACTION_PROVIDER` / `MAX_TRANSCRIPT_UPLOAD_MB` | Transcript storage bucket, extraction backend (`heuristic` or `openai`), and upload size cap. |

Environment variables are validated with a typed Zod schema at first use
(`lib/env.ts`). Authorization rules live only in server configuration
(`lib/auth/config.ts` reads them; `lib/auth/rules.ts` is the pure, unit-tested
policy) and are never bundled into client code.

## Authentication, accounts & transcripts

Google-only OAuth via Supabase Auth, with two clearly separated entry points on
the landing page - **Student Login** and **Admin Login**.

- **Students** may sign in only with a verified Google account whose email ends
  exactly with `@ep-student.org` (normalized to lowercase). **Admins** need a
  verified `@edenpr.k12.mn.us` account or an allowlisted email
  (`ADMIN_EMAIL_ALLOWLIST`, plus the in-app **Admin → Access** list). The role
  is derived from the verified identity, never from which button was pressed -
  so choosing "Admin Login" cannot by itself grant admin.
- Enforcement is server-side: the OAuth callback (`app/auth/callback`) verifies
  the email and provisions an idempotent `profiles` row with the derived role;
  `middleware.ts` refreshes the session and gates protected routes;
  `requireStudent` / `requireAdmin` (`lib/auth/session.ts`) re-check on every
  protected page, API route, and server action; Postgres RLS enforces ownership
  at the database. Sessions use secure, HTTP-only cookies (no privileged tokens
  in localStorage).
- **First-time students** complete a multi-step, autosaving onboarding wizard
  (new vs. returning). **Returning students** upload a transcript (PDF/PNG/
  JPG/JPEG) to a private bucket; it's processed (provider-abstracted extraction:
  built-in heuristic, or OpenAI vision), each course is matched to the EPHS
  catalog with a confidence level, and the student reviews/corrects and confirms
  before anything touches their plan. Confirmed courses become structured
  `academic_records` that flow into the four-year planner and live graduation
  tracking. See `docs/SECURITY_AND_PRIVACY.md`.

> Running the authenticated experience requires a Supabase project and Google
> OAuth credentials (see below). Without them, the public catalog, planner-meta,
> and assistant still work; sign-in shows a clear "not configured" state.

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

## The EPHS AI Assistant - how grounding works

`POST /api/chat` (see `lib/ai/chat.ts`):

1. Zod-validates the conversation; rate-limits per IP.
2. Rebuilds context **on every request** from the authoritative dataset:
   retrieval over all 269 courses (latest turns weighted, direct title
   mentions always included), plus graduation rules, pathways, the academic
   calendar model, and the dataset's known limitations.
3. Injects the current date so answers stay anchored to the registration
   cycle, and computes engine eligibility per course when a profile exists.
4. Calls OpenAI (default `gpt-4o`, streaming, server-only key) with hard
   grounding rules: EPHS data only, cite guide pages, say "not in the guide"
   instead of guessing, never upgrade engine eligibility, decline off-topic
   requests. The conversation is delimited as untrusted data.
5. On any failure - no key, timeout, connection error - falls back to a
   deterministic catalog lookup, clearly labeled in the UI.

## Supabase production path (optional)

The MVP serves the catalog from the versioned dataset and keeps student data
in the browser. To move to hosted Postgres + Auth + RLS:

1. Create a Supabase project.
2. Run the migrations in order: `supabase/migrations/0001_initial_schema.sql`
   then `0002_auth_transcripts_records.sql` (Supabase SQL editor or CLI). `0002`
   adds the Google-identity fields, onboarding, transcripts, academic records,
   equivalencies, audit columns, RLS policies, and the private `transcripts`
   storage bucket.
3. In Supabase **Auth → Providers**, enable **Google** and paste your Google
   OAuth client id/secret (from Google Cloud Console). Add
   `${APP_URL}/auth/callback` as an authorized redirect URL. The OAuth client
   *secret* lives in Supabase, never in this repo or client code.
4. Set the Supabase + authorization env vars in `.env.local` (see the table and
   `.env.example`).
5. `npm run data:import` - idempotent, versioned by the source PDF's SHA-256,
   with explicit activation. Keeps older guide versions for audit.

See `docs/DATA_IMPORT_PLAN.md` and `docs/SECURITY_AND_PRIVACY.md`.

## Demo mode

`DEMO_MODE=true` (default) exposes `/counselor` with three clearly fictional
students (engineering, business, communication & arts) - each with completed
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
3. Deploy - no database required for the MVP.

## Known limitations

From the dataset itself (surfaced in-app on `/admin`):

- The guide provides no course numbers, seat counts, teacher/period
  assignments, or per-term offerings - the app never displays or invents them.
- The guide has no complete numerical graduation credit table; the
  requirements page reports *verified satisfied / verified open / needs
  counselor confirmation* instead of a fake percentage.
- Pathway page markers (`*`, `**`, `TC`, `•`, `@`) are preserved verbatim;
  meanings not defined in the guide are not invented.
- GPA projections are intentionally not implemented - no official EPHS
  GPA/weighting policy is included in the guide (see the note in
  `lib/domain/graduation-rules.ts`).
- Cross-listed courses keep every source appearance; conflicts are shown, not
  silently resolved.

## Documentation

- `docs/IMPLEMENTATION_PLAN.md` - phases, status, decisions
- `docs/ARCHITECTURE.md` - system design
- `docs/DATA_IMPORT_PLAN.md` - dataset lifecycle and Supabase import
- `docs/DATA_AUDIT.md` - generated dataset integrity report
- `docs/SECURITY_AND_PRIVACY.md` - security model and student-privacy policy
- `docs/DEMO_SCRIPT.md` - leadership demo walkthrough
