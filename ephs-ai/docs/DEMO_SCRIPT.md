# Leadership Demo Script (≈ 10 minutes)

Audience: EPHS leadership (e.g., Ms. Moses). No real student data is used at
any point — all three demo students are clearly fictional.

## Setup (before the meeting)

1. Deploy or run locally (`npm run dev`). Zero configuration required.
2. Optional: set `OPENAI_API_KEY` to show live AI mode; without it the same
   flow runs in deterministic Smart match mode — both are demo-safe.
3. Confirm `DEMO_MODE=true` (default).

## Walkthrough

1. **Landing page (`/`)** — one screen: what EPHS AI is, real counts from the
   official guide (269 courses, 5 pathways, 59 cited pages), and the counselor
   -verification banner. *Talking point: everything shown is from the official
   2026-27 Course Guide; nothing is invented.*

2. **Search a real course (`/courses`)** — search "aviation", filter by
   department or AP/College-credit. Point out server-side pagination and the
   result count.

3. **Course details & citation** — open *Aviation I: Taking Flight*. Show the
   exact official description, exact prerequisite wording, grades, credits,
   term-length interpretation, and the footer: *"Source: EPHS Course Guide
   2026-27, page N."* For a cross-listed course (e.g. Human Geography 9),
   expand "all appearances" to show conflicts are preserved, not hidden.

4. **Add to plan** — from the course page, choose a grade and starting term,
   then open `/plan`. Show the four-term columns per grade — EPHS's real
   calendar model — and multi-term courses spanning consecutive terms.

5. **EPHS-specific validation** — in the counselor view, open *Demo Student —
   Engineering* and "Explore as this student". The planner shows a real
   eligibility warning: *AP Computer Science A* planned before its
   prerequisite (*AP Computer Science Principles*) is complete. Requirements
   page (`/requirements`): flip the class-year selector between 2027
   (technology credit rule) and 2028+ (personal finance rule) — both cite
   page 2 of the guide.

6. **Pathways (`/pathways`)** — open *Engineering, Technology &
   Manufacturing*. Show official capstones/supporting courses, the preserved
   `*`/`TC`/`•` markers, and the student's aligned courses — deliberately no
   fake "completion %".

7. **AI recommendations (`/recommend`)** — ask: *"I love robotics and want to
   become a mechanical engineer. What should I take in 10th grade?"* Show
   that every suggestion is a real course card with an eligibility badge
   computed by the rules engine, prerequisite explanation in the guide's own
   words, and page citations. *Talking point: the model can only choose from
   pre-validated candidates; hallucinated courses are rejected in code.*

8. **Grounding guarantees** — briefly show `/admin`: dataset identity pinned
   by SHA-256, counts, cross-listings, unresolved pathway names, and the
   guide's own known limitations surfaced honestly.

9. **Counselor view (`/counselor`)** — read-only plan table, validation
   warnings, counselor notes, printable summary (Print button).

10. **Privacy & roadmap (`/privacy`)** — student data stays in the browser in
    this MVP; AI requests are anonymized; one-click data deletion. Production
    path: district Google sign-in with row-level security (schema already
    written), SIS integration later. *Do not claim live SIS integration, live
    seat counts, or district approval — none of those exist yet.*

## Q&A crib notes

- **"What if the AI is wrong?"** The deterministic engine is the authority;
  the AI cannot upgrade eligibility or invent courses, and every claim carries
  a page citation a counselor can check.
- **"What if the AI is down?"** The entire product keeps working; the
  recommender switches to labeled Smart match mode.
- **"Where does the data come from?"** Only the official 2026-27 Course Guide
  (SHA-256 pinned). New guide years are imported, audited, previewed, and then
  activated by an administrator.
