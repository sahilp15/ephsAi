# EPHS AI Assistant 🦅

**Accurate, EPHS-specific answers for students & families.**

The EPHS AI Assistant is a friendly, **student-built** web app that answers Eden
Prairie High School questions — course selection, graduation requirements, schedule
changes, AP/honors/PSEO classes, Pathways, clubs, important dates, and who to contact —
using **official EPHS information**, always linking the real source, and always
pointing to a real counselor for big decisions.

- **No login. No accounts. Zero personal data collected.**
- **Grounded:** answers only from a verified knowledge base — it never invents EPHS
  facts. If it doesn't know, it says so and links the correct official page/office.
- **Safe:** mental-health, crisis, discipline, and privacy guardrails are built into
  the system prompt (including the 988 Suicide & Crisis Lifeline).
- **Counselor-first:** surfaces the EPHS counselor booking (Acuity) link whenever it's
  relevant.

---

## Where your API key goes (important)

The AI key is used **only on the server** — it is never exposed in the frontend. All
requests go through the server route `app/api/chat/route.ts`, which reads
`process.env.GEMINI_API_KEY`.

To set it locally:

```bash
cp .env.example .env.local
```

Then open `.env.local` and paste your key after `GEMINI_API_KEY=`:

```
GEMINI_API_KEY=your_key_here
```

That's the only required variable. **Never** put the key in any file under `app/`,
`components/`, or `config/`, and never commit `.env.local` (it's git-ignored).

### Get a free Gemini API key (no credit card)

1. Go to **[Google AI Studio → API keys](https://aistudio.google.com/apikey)**.
2. Sign in with any Google account.
3. Click **Create API key** and copy it into `.env.local` as shown above.

---

## Run it locally

Requires **Node 18+**.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**, click **Ask the Assistant**, and try
*"How many credits do I need to graduate?"* — you'll get an EPHS-specific answer with a
**Sources** link.

> Tip: if you ever see odd build/cache behavior, stop the server, run `rm -rf .next`,
> and `npm run dev` again.

---

## EPHS information that's included

The knowledge base (`/knowledge`, markdown by category) is built from **verified
sources**:

- The official **2026–27 EPHS Course Guide** (provided PDF): departments, AP/honors/
  PSEO and 40+ college-level courses, Pathways & Capstones, the course-selection
  timeline (Feb 2–13, Open House Feb 2), and the graduation-requirement change
  (Class of 2027 keeps the technology credit; Classes of 2028+ require personal
  finance).
- Facts confirmed on **edenpr.org / my.edenpr.org**: 54 total credits to graduate;
  EPHS address & phone lines; student/office hours; the **Student Support Team (SST)**
  counselor structure with the by-last-name roster.
- The **counselor Acuity booking link** you provided, woven into every
  course/schedule/graduation/counselor answer.

**Verified-only policy & limitation:** edenpr.org blocks automated scraping, so pages
could not be bulk-imported. Where a detail isn't verified (exact bell-period times, the
full club roster, the full 2026–27 calendar beyond course selection), the assistant
**says it's not certain and links the official page** instead of guessing. See the
"To verify / update next" checklist in `knowledge/README.md`.

### Updating the knowledge base later

1. Add one `.md` file per topic in the right category folder under `/knowledge`.
2. Fill the frontmatter — especially `source_url` (the official EPHS page).
3. Write in plain language; keep facts verifiable; no personal data.
4. Restart `npm run dev` (or redeploy) to load changes.

Full instructions and the official link list are in
**[`knowledge/README.md`](./knowledge/README.md)**.

---

## How it works

1. **Knowledge base** = markdown files in `/knowledge` with frontmatter
   (`topic`, `category`, `source_url`, `last_updated`).
2. **Loader** (`lib/knowledge.ts`) reads/caches every file and assembles one grounding
   context string.
3. **Chat route** (`app/api/chat/route.ts`) builds `SYSTEM_PROMPT` + knowledge +
   recent turns, calls the AI provider, and **streams** the answer. Source URLs ride
   in the `X-Eddy-Sources` header for the UI's "Sources" row.
4. **Scaling seam** (`lib/retrieve.ts`): currently injects all files; swap in a keyword
   pre-filter or retrieval later without touching the route.

### AI providers & resilience

- **Primary:** Google Gemini (`@google/generative-ai`), default `gemini-2.5-flash`.
- **Fallback:** Groq (OpenAI-compatible) if `GROQ_API_KEY` is set — used automatically
  when Gemini is rate-limited (429). If nothing is available, the UI shows a friendly
  "a bit busy" message and never crashes. Swap providers in `lib/ai/index.ts`.

### Configuration

- **`config/brand.ts`** — product name, tagline, colors, EPHS contacts, and all
  official links (single source of truth). Change the product name everywhere here.
- **`config/content.ts`** — welcome message, suggested prompts, and the shared quick
  actions (Course Help · Graduation Requirements · Meet a Counselor · Clubs · Important
  Dates).

### Environment variables

| Variable            | Required | Purpose                                                  |
| ------------------- | -------- | -------------------------------------------------------- |
| `GEMINI_API_KEY`    | ✅       | Primary provider (Google Gemini). Server-side only.      |
| `GEMINI_MODEL`      |          | Override model. Default `gemini-2.5-flash`.              |
| `GROQ_API_KEY`      |          | Enables automatic fallback when Gemini is rate-limited.  |
| `GROQ_MODEL`        |          | Override model. Default `llama-3.3-70b-versatile`.       |
| `KV_REST_API_URL`   |          | Vercel KV — enables feedback persistence (else stub).    |
| `KV_REST_API_TOKEN` |          | Vercel KV token (paired with the URL above).             |

---

## Deploy to Vercel (free tier)

1. Push to GitHub and **Import** the repo in [Vercel](https://vercel.com).
2. Add **`GEMINI_API_KEY`** under **Settings → Environment Variables**.
3. *(Optional)* Add a **KV** store under **Storage** to persist feedback.
4. **Deploy.** No config changes needed.

---

## Pages

- `/` — landing: hero, quick actions, help cards, how-it-works, disclaimer.
- `/chat` — streamed chat with quick-action bar, suggested prompts, Sources, thumbs
  feedback. Supports `?prompt=...` deep links from the landing quick actions.
- `/about` — what it is and how it stays safe & accurate.
- `/feedback` — no-PII feedback form (Vercel KV or console stub).

---

## Project structure

```
config/brand.ts          # name, tagline, colors, contacts, links (single source of truth)
config/content.ts        # welcome message, suggested prompts, quick actions
lib/prompt.ts            # EPHS-specific system prompt + knowledge assembly
lib/knowledge.ts         # load/parse/cache knowledge, build context
lib/retrieve.ts          # retrieval seam (passthrough stub today)
lib/ai/                  # Provider interface + gemini/groq + fallback logic
lib/feedback/            # pluggable feedback adapter (Vercel KV or stub)
app/                     # /, /chat, /about, /feedback + /api/chat, /api/feedback
components/              # Logo, Header, Footer, DisclaimerBand, Chat, FeedbackForm
knowledge/               # verified EPHS knowledge base (markdown, by category)
```

---

## For the portfolio

### LinkedIn project description

> Built the **EPHS AI Assistant**, a grounded AI helper for Eden Prairie High School
> (~2,800 students, 425+ courses) that answers students' and families' questions about
> course selection, graduation requirements, schedules, and counselors. It responds
> only from official EPHS information, always links the source, routes students to a
> real counselor (Acuity) and to crisis resources (988), and collects zero personal
> data. Shipped on Next.js + TypeScript with a server-side, swappable AI backend
> (Gemini, Groq fallback) and a one-file knowledge pipeline so non-engineers can keep
> it current.

### Resume bullet

> Designed and shipped a grounded, safety-first AI assistant (Next.js, TypeScript,
> Gemini) for a 2,800-student high school — answering course, graduation, and counselor
> questions from official sources with zero personal-data collection, server-side key
> handling, and automatic provider failover.

### Metrics to track

- Weekly active users (no PII) · questions answered · % answered from the knowledge
  base vs. "not sure" · thumbs-up rate · # of EPHS resources indexed · counselor-link
  clicks · estimated time saved · fallback/error rate.

---

*Made for EPHS students & families. Go Eagles. This is a student-built helper, not an
official EPHS source — always confirm important decisions with your counselor.*
