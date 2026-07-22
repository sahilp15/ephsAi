# EPHS AI — UI/UX Redesign Plan

## 1. Repository overview
Next.js 14 (App Router) · React 18 · Tailwind 3 · TypeScript · Supabase
(`@supabase/ssr`) · OpenAI · `lucide-react` · `clsx` · `zod` · `pdfjs-dist`.
The app lives in `ephs-ai/`. Domain logic (catalog search, graduation rules,
prerequisites, plan validation, transcript matching, AI grounding) is pure and
well-tested (114 Vitest tests). The UI was a single global shell around every
route in a "varsity editorial" style.

## 2. Current product flows
Public landing → student/admin login (Google OAuth via Supabase) → onboarding
(6-step, autosaved) → dashboard → courses / course detail → four-year planner →
requirements → pathways → clubs → transcript upload/review → AI chat (grounded,
streaming). Plus a public no-login `/demo`, counselor tools, and an admin area
(catalog/clubs/equivalency/audit/access).

## 3. Current design problems
Everything shared one dark header + footer; heavy varsity motifs (skewed badges,
wing-stripes, panel-grain, forced-uppercase condensed headings) read more like
an athletics program than a calm academic planner; red used on nearly every
element; no real app shell, sidebar, command palette, or mobile bottom nav; the
dashboard was a flat stat grid + link list rather than a prioritized bento.

## 4. Functionality that MUST be preserved
Auth/RLS, Supabase clients, server actions, middleware gating, student
context/localStorage, onboarding data model + autosave, catalog data + URL-backed
server search, course detail data, planner (DnD + validation + persistence),
graduation rules, transcript pipeline, clubs, AI grounding/streaming/stop/retry/
persistence/citations/offline mode, counselor + admin features, API routes, env
structure, and all tests.

## 5. Information architecture
Four shells via route groups (URLs unchanged):
`(marketing)` public · `(focused)` login + onboarding · `(app)` student
(sidebar + top bar + command palette + mobile nav) · `(staff)` admin + counselor.
Student nav grouped: **Planning** (Dashboard, Courses, Four-Year Plan,
Requirements, Pathways) · **Explore** (Clubs, Ask EPHS AI) · **Student**
(Transcript, Profile).

## 6. Public shell
Light header on warm paper (logo, primary links, Ask EPHS AI, Sign in), calm
dark footer. `components/navigation/PublicHeader.tsx`, `components/Footer.tsx`.

## 7. Student app shell
`components/app-shell/AppShell.tsx` orchestrates a collapsible `AppSidebar`
(persisted), a compact `AppTopbar` with the ⌘K launcher, the `CommandPalette`,
and mobile `MobileTabBar` + `MoreSheet`.

## 8. Admin & counselor shell
`app/(staff)/layout.tsx` — a distinct slim staff command bar (logo, "Staff area"
badge, student-view link, sign out). Role checks remain in `requireAdmin` /
counselor guards; chrome never gates access.

## 9. Page-by-page plan
Dashboard → bento (dominant plan block, dark AI launcher, graduation progress,
transcript status, setup checklist). Courses → filter rail + chips + sort +
grid/list toggle + mobile drawer. Course detail → breadcrumb, surfaced prereq,
guide fields, contextual AI input. Planner → keep grade/term grid + DnD +
select-to-move, calmer tokens. Chat → calm empty state + composer, retry, status
dot. Onboarding → sentence-case stepper + descriptions. Requirements/Pathways/
Clubs/Transcript → calmer tokens, semantic status, breadcrumbs, Ask-AI actions.
Landing → focused hero + AI input + one scroll-revealed real preview. Auth →
focused card. Staff → light restyle within the staff shell.

## 10. Design tokens
EPHS red `#D8272E` (+ dark/deep/soft/tint) reserved for actions/brand; ink
scale (charcoal/ink/muted/faint); surfaces (bg `#F7F5F1`, sunken, card `#FFFFFF`,
borders); restrained semantics — success `#0F7A52`, warn `#B45309`, info
`#1D5F9C`, each with a soft tint. Defined in `tailwind.config.ts` + `globals.css`.

## 11. Typography
Instrument Sans for UI/headings (sentence case, `tracking-tight`); Barlow
Condensed reserved for the brand lockup and small caps labels (`.kicker`); IBM
Plex Mono for metadata/citations. The global forced-uppercase `h1` rule was
removed.

## 12. Spacing
Consistent control heights (h-8/10/12), section rhythm via `space-y-6`, content
capped at `max-w-6xl` in-app and `max-w-shell` public; `max-w-prose` for lede text.

## 13. Component system
Primitives in `components/ui.tsx` (Button, Card, SectionHeader, PageHeader, Chip,
CourseBadge, WarningBanner, EmptyState, ErrorState, Skeleton, StatCard,
ProgressBar, SourceCitation). Feature dirs: `app-shell/`, `navigation/`,
`command-palette/`, `dashboard/`, `chat/`, `marketing/`.

## 14. 21st.dev selections
See `21ST_COMPONENT_RESEARCH.md` — sidebar (arunjdass), mobile menu (easemize),
command palette (rafa-porto/jatin), bento (aceternity), AI input (kokonut),
composer (Alwurts), filters (ruixen), checklist (chowlol), scroll reveal
(aceternity). All adapted to zero-dependency EPHS-native components.

## 15. Dependency decisions
**No new dependencies.** All motion is CSS; all interactive primitives
hand-written. Avoided Framer Motion/GSAP and registry demo scaffolding.

## 16. Responsive strategy
Mobile-first; sidebar `hidden lg:flex` with a bottom tab bar + more sheet on
phones; filter/`more` drawers; safe-area padding; content columns collapse in
sensible reading order; no horizontal overflow; scroll containers for wide content.

## 17. Accessibility
Semantic landmarks + skip link, `aria-current` nav, focus-trapped dialogs/drawers
with Escape + focus restoration, combobox/listbox command palette, visible focus
rings, icon+text status (never color-only), labelled inputs, 44px+ targets.

## 18. Motion
One CSS system with a small timing scale (micro ~150ms, panel ~220ms, reveal
~500–700ms) and `ep-out` easing. `prefers-reduced-motion` removes transforms
(not just shortens them) via `globals.css` + `[data-reveal]`.

## 19. Implementation phases
1 Audit + research + tokens · 2 Foundations + shells · 3 Navigation + palette ·
4 Core pages (dashboard, courses, detail, chat) · 5 Supporting pages · 6 Public +
auth + onboarding · 7 Staff · 8 Refinement (responsive/a11y/visual QA).

## 20. Testing
`npm run typecheck`, `npm run test` (114), `npm run build` green throughout;
Playwright screenshot pass (desktop + mobile) of landing, courses, chat, palette,
login for visual QA.

## 21. Risks
Route-group move breaking imports/URLs; turning server components into client
ones; hydration mismatches from persisted state; regressing streaming/DnD/
autosave logic; altering source course data.

## 22. Mitigations
Route groups don't change URLs (verified in build); cross-module imports fixed and
typechecked; persisted state read in effects (no SSR mismatch); all domain/logic
files left untouched — only presentation changed; course titles rendered exactly
as stored (no casing transforms); green typecheck/test/build gates every commit.
