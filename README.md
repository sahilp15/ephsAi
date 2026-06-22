# Eddy — Your Eden Prairie High guide 🦅

Eddy is a friendly, **student-built** AI assistant that answers Eden Prairie
High School (EPHS) students' real questions — course selection, graduation
requirements, schedule changes, clubs, who to email, school logistics — using
**only** accurate EPHS information, always linking the official source, and
always telling students when to talk to a real counselor or trusted adult.

- **No login. No accounts. Zero personal data collected.**
- **Grounded:** Eddy answers only from a markdown knowledge base you control. It
  never invents EPHS facts — if it doesn't know, it says so and points you to
  the right office.
- **Safe:** Mental-health, crisis, discipline, and privacy guardrails are built
  into the system prompt (including the 988 Suicide & Crisis Lifeline).
- **Built to scale** to thousands of students on Vercel's free tier.

---

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS** — single deployable app.
- **Google Gemini** (free tier) via `@google/generative-ai` — default model
  `gemini-2.5-flash`.
- **Groq** as an automatic fallback (OpenAI-compatible) when Gemini is
  rate-limited.
- **No database, no vector store, no embeddings.** Grounding is done by direct
  context injection from `/knowledge`. (There's a clean seam in
  `lib/retrieve.ts` to add retrieval later.)

---

## Quick start (local)

You only need a **free Gemini API key** to run Eddy end-to-end.

### 1. Get a free Gemini API key (no credit card)

1. Go to **[Google AI Studio → API keys](https://aistudio.google.com/apikey)**.
2. Sign in with any Google account.
3. Click **Create API key** and copy it. (Free tier — no credit card required.)

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and paste your key:

```
GEMINI_API_KEY=your_key_here
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Click **Ask Eddy →** and try a question like
*"How many credits do I need to graduate?"* You'll get an answer grounded in the
example knowledge files, with a **Sources** link underneath.

> Requires **Node 18+**.

---

## How grounding works

1. **Knowledge base** = markdown files in `/knowledge`, organized by category.
   Each file has frontmatter (`topic`, `category`, `source_url`, `last_updated`)
   plus a plain-language body.
2. **Loader** (`lib/knowledge.ts`) reads and parses every `knowledge/**/*.md`,
   then assembles a single grounding-context string (cached in memory).
3. **Chat route** (`app/api/chat/route.ts`) builds the request as
   `SYSTEM_PROMPT` + `KNOWLEDGE_CONTEXT` + recent turns, calls the provider, and
   **streams** the answer back. Source URLs travel in the `X-Eddy-Sources`
   header so the UI can render the "Sources" row.
4. **Scaling seam** (`lib/retrieve.ts`): currently returns *all* files (direct
   injection). If the knowledge base ever exceeds ~400K tokens, implement the
   keyword pre-filter stub there — no changes needed elsewhere.

---

## Adding real EPHS info

This is the most important step to make Eddy useful. See
**[`knowledge/README.md`](./knowledge/README.md)** for the full guide. In short:

1. Create one `.md` file per topic in the right category folder
   (`academics`, `schedule`, `staff`, `clubs`, `logistics`, `support`, `college`).
2. Fill the frontmatter — especially `source_url` (the official EPHS page).
3. Write in plain language. Keep facts verifiable. **No personal data.**
4. Delete the example files (marked `EXAMPLE — replace with real EPHS info`).
5. Restart `npm run dev` (or redeploy) to load the changes.

**High-value topics to add first:** graduation/credit requirements · course
catalog highlights (AP/honors/PSEO/pathways) · schedule-change process + who to
contact · club list · counselor/staff directory · bell schedule + calendar ·
parking/bus/lunch logistics · support resources.

---

## Configuration

Everything brand-related lives in **`config/brand.ts`** — change the product
name, tagline, colors, and links in one place. App copy (welcome message,
suggested prompts) lives in `config/content.ts`.

### Environment variables

| Variable            | Required | Purpose                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `GEMINI_API_KEY`    | ✅       | Primary provider (Google Gemini).                              |
| `GEMINI_MODEL`      |          | Override model. Default `gemini-2.5-flash`.                    |
| `GROQ_API_KEY`      |          | Enables automatic fallback when Gemini is rate-limited.        |
| `GROQ_MODEL`        |          | Override model. Default `llama-3.3-70b-versatile`.             |
| `KV_REST_API_URL`   |          | Vercel KV — enables feedback persistence (else console stub).  |
| `KV_REST_API_TOKEN` |          | Vercel KV token (paired with the URL above).                   |

### Provider fallback & rate limits

If Gemini returns a 429/rate-limit, Eddy retries once, then falls back to Groq
if `GROQ_API_KEY` is set. If no fallback is available, it returns a friendly
"I'm a bit busy — try again in a moment" message. The UI never crashes on a
provider error. Swap providers/models from `lib/ai/index.ts`.

### Feedback persistence

Thumbs up/down and the feedback form post to a pluggable adapter
(`lib/feedback/`). With `KV_*` env vars set, feedback is written to Vercel KV;
otherwise a no-op stub logs to the server console. **Feedback payloads never
contain personal data.**

---

## Deploy to Vercel (free tier)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **New Project → Import** the repo. The
   defaults work — no config changes needed.
3. Add the environment variable **`GEMINI_API_KEY`** (and optionally
   `GROQ_API_KEY`) under **Settings → Environment Variables**.
4. *(Optional)* Add a **KV** store under **Storage** to persist feedback — the
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` vars are injected automatically.
5. **Deploy.** Eddy runs on the free tier.

---

## Safety & privacy

- No input field anywhere asks for identifying information.
- No analytics capture message contents to third parties.
- **Crisis path:** messages expressing distress get a warm, resource-pointing
  response (988 + counselor + trusted adult) — never a diagnosis.
- **"Not in knowledge base" path:** Eddy admits uncertainty and points to the
  right office/link instead of inventing facts.
- Every page carries the "not official" disclaimer.
- `.env.example` documents all env vars; real keys are git-ignored.

---

## Project structure

```
config/brand.ts          # name, tagline, colors, links — single source of truth
config/content.ts        # welcome message, suggested prompts, cards, steps
lib/prompt.ts            # SYSTEM_PROMPT + knowledge assembly
lib/knowledge.ts         # load/parse/cache knowledge, build context
lib/retrieve.ts          # retrieval seam (passthrough stub today)
lib/ai/                  # Provider interface + gemini/groq + fallback logic
lib/feedback/            # pluggable feedback adapter (Vercel KV or stub)
app/                     # /, /chat, /about, /feedback + /api/chat, /api/feedback
components/              # Logo, Header, Footer, DisclaimerBand, Chat, FeedbackForm
knowledge/               # the knowledge base (markdown, by category)
```

---

## For the portfolio

### LinkedIn project description

> Built **Eddy**, an AI assistant for Eden Prairie High School (~2,800 students,
> 425+ courses) that answers students' questions about course selection,
> graduation requirements, schedules, and clubs. Eddy is **grounded** — it
> responds only from official EPHS information, always links the source, and is
> built with safety guardrails that route mental-health and crisis topics to
> real counselors and the 988 Lifeline. Shipped on Next.js + TypeScript with a
> swappable AI backend (Gemini, Groq fallback), zero personal-data collection,
> and a one-file content pipeline so non-engineers can keep the knowledge base
> current.

### Resume bullet

> Designed and shipped a grounded, safety-first AI assistant (Next.js,
> TypeScript, Gemini) for a 2,800-student high school, answering course,
> graduation, and logistics questions from official sources with zero
> personal-data collection and automatic provider failover.

### Metrics to track

- **Weekly active users** (unique sessions, no PII).
- **Questions answered** per week.
- **% answered from the knowledge base vs. "not sure"** (grounding coverage).
- **Thumbs-up rate** (answer quality).
- **# of EPHS resources indexed** (knowledge files / source links).
- **Estimated time saved** (≈ minutes per question × questions answered).
- **Fallback rate** (how often Groq is used) and **error rate**.

---

*Made by a student, for EPHS students. Go Eagles. Eddy is not an official EPHS
source — always confirm important decisions with your counselor.*
