# EPHS AI

**Student course-planning platform for Eden Prairie High School**, grounded in
the official *EPHS Course Guide 2026-27*.

The entire application lives in the [`ephs-ai/`](./ephs-ai) folder:

```
ephs-ai/
├── app/                  # Next.js App Router pages and API routes
├── components/           # EPHS design-system components
├── lib/                  # Catalog store, deterministic domain engine, AI pipeline
├── data/                 # Versioned course-guide dataset (source of truth)
├── docs/                 # Implementation plan, data audit, security, demo script
├── scripts/              # Data audit + idempotent Supabase import
├── supabase/migrations/  # Production Postgres schema with RLS
└── tests/                # Vitest unit tests for the domain engine and AI guards
```

## Quick start

```bash
cd ephs-ai
npm install
npm run dev          # http://localhost:3000 — fully functional with zero config
```

Add an OpenAI key in `ephs-ai/.env.local` to enable AI recommendations
(without it, the recommender runs in deterministic **Smart match mode**):

```env
OPENAI_API_KEY=sk-...
```

See [`ephs-ai/README.md`](./ephs-ai/README.md) for full setup, Supabase
deployment, testing, and the leadership demo script.
