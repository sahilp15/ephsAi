# Security & Privacy

This is a school application. Defaults are privacy-first and conservative.

## Data handling (MVP deployment)

- **No server-side student records.** Profile, course history, and the
  four-year plan persist in the student's own browser (localStorage). Clearing
  is one click (`/privacy` → "Delete my planning data").
- **Anonymized AI requests.** `/api/recommend` accepts only planning context:
  grade, graduation year, interest keywords, rigor preference, pathway ids,
  and course ids/titles. Names, emails, and counselor notes are never sent to
  the model. Server logs record latency and failure categories, not
  identity-linked prompt content.
- **Minimal collection.** Onboarding asks only for planning-relevant data.
- **No advertising use, no sale of student data, no unnecessary prompt
  retention.**

## Secrets

- `OPENAI_API_KEY` is read server-side only (`lib/ai/openai-provider.ts`,
  behind `server-only`). It is never exposed in a client bundle, never logged.
- `.env*` files are gitignored; `.env.example` documents every variable.
- `SUPABASE_SERVICE_ROLE_KEY` is used exclusively by the server-side import
  script.

## Endpoint hardening

- All API input is Zod-validated with strict bounds (message length, array
  caps, enum values).
- Per-IP fixed-window rate limiting on the AI endpoint
  (`AI_RATE_LIMIT_PER_HOUR`, default 20/h); friendly 429s.
- 30-second model timeout; requests abort when the client disconnects.
- AI failures degrade to deterministic Smart match mode - never a broken page.

## Prompt-injection defenses

- Course descriptions and student messages are delimited as **untrusted
  data**; the system prompt explicitly refuses instructions found inside them.
- Deterministic post-validation makes injection non-exploitable in effect:
  course IDs outside the candidate set are rejected, engine eligibility cannot
  be upgraded by the model, and citations are clamped to each course's real
  source pages.

## Production path (Supabase)

`supabase/migrations/0001_initial_schema.sql` ships tested-by-review RLS:

- **Students** read/write only their own profile, history, plans, plan
  entries, recommendation sessions, and feedback.
- **Counselors** get read access only to students explicitly shared with them
  (`counselor_students`), plus counselor-note updates on those students'
  plan entries.
- **Admins** manage guide versions, view audit events and import jobs.
- Catalog tables are public-read (they contain only published guide content).
- Authorization is enforced at the database layer - never only by hidden UI.
- Auth: Supabase Auth with Google OAuth; restrictable to approved district
  account domains when the district enables it.
- `audit_events` records administrative actions.

## Data retention

- MVP: recommendation history lives in the student's browser (last 10) and is
  deletable by the student.
- Hosted path: retention is configurable at the table level; the recommended
  default is purging `recommendation_messages` after 90 days and keeping only
  aggregate feedback. Document the district's chosen policy here before launch.
