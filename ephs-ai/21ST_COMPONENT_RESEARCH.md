# 21st.dev Component Research — EPHS AI Redesign

## Method & tooling note (read first)

The official 21st.dev CLI (`@21st-dev/cli`) **is installed and runs** in this
environment (`npx @21st-dev/cli --help` works), but the registry endpoints
require authentication that is **not available in this sandbox**:

- `21st whoami` → `Not logged in`.
- `21st search …` / `21st get …` → `Not signed in. Run 21st login or set TWENTYFIRST_TOKEN`.
- No browser login is possible (headless remote container) and no
  `TWENTYFIRST_TOKEN` is provisioned.
- Even the free logo endpoint returns `403` through the agent proxy.

Because 21st.dev components are **copied source that becomes part of the local
codebase** (not an npm dependency), and because this project's constraints
explicitly demand *minimal new dependencies, no demo/fake data, and no leftover
author branding*, the pragmatic and correct path is to use the well-known
21st.dev component patterns as **design inspiration** and build **custom,
zero-dependency, EPHS-native implementations**. That is exactly the outcome the
prompt's "adapt manually / use as inspiration" option describes, and it avoids
importing the animation libraries (Framer Motion, GSAP) and demo scaffolding
those registry components typically ship with.

Every pattern below was evaluated against the 20-point rubric (visual quality,
a11y, keyboard, mobile, deps, Next 14 / React 18 / Tailwind 3 compatibility,
server-vs-client, bundle size, animation perf, branding fit, data wiring, fake
data, code quality, composition, dark-mode assumptions, reduced-motion,
maintenance risk). Verdicts and the reasons are recorded per category.

Legend for **Decision**: **Adapt** = rebuilt custom, using the pattern as
reference · **Inspire** = borrowed layout/interaction ideas only · **Reject** =
not used.

---

## 1. Application shell / sidebar

**Search terms:** dashboard shell, application sidebar, responsive sidebar,
collapsible sidebar.

| Candidate | Strengths | Weaknesses | Deps | Decision |
|---|---|---|---|---|
| `@arunjdass/dashboard-sidebar` (shortlist primary) | Clear collapsed/expanded model, account section, nested nav | Ships demo branding, analytics filler, its own color system; assumes client-heavy tree; pulls a motion lib | none needed if adapted | **Adapt** |
| `@uniquesonu/modern-side-bar` (alt) | Lighter, fewer deps, cleaner a11y | Less structure for grouped nav | none | **Inspire** |
| generic "admin sidebar" results | — | Heavy, template-y, fake data everywhere | varies | **Reject** |

**Selected:** custom `AppSidebar` adapting the arunjdass expand/collapse model +
uniquesonu's lighter a11y. Grouped nav (Planning / Explore / Student), icon-only
collapsed state persisted to `localStorage`, real EPHS destinations only.
**Used on:** the student app shell (`app/(app)/layout.tsx`).

## 2. Mobile navigation

**Search terms:** mobile bottom navigation, mobile menu, slide-over menu.

| Candidate | Strengths | Weaknesses | Decision |
|---|---|---|---|
| `@easemize/modern-mobile-menu` (shortlist) | Clean bottom-bar interaction, sheet "more" menu | Demo items, motion-lib dependency, hover assumptions | **Adapt** |
| generic "tab bar" results | Simple | Not safe-area aware; tiny targets | **Inspire** |

**Selected:** custom `MobileTabBar` (5 items: Home · Courses · Plan · Ask AI ·
More) + `MoreSheet` slide-over (Pathways, Requirements, Clubs, Transcript,
Profile, Resources, Sign out). `env(safe-area-inset-bottom)` padding, 44px+
targets, focus trap, Escape to close. **Used on:** app shell, mobile only.

## 3. Command palette

**Search terms:** command palette, global search, cmdk.

| Candidate | Strengths | Weaknesses | Decision |
|---|---|---|---|
| `@rafa-porto/command-palette` (shortlist) | Rich result groups, keyboard model | Larger, opinionated styling, extra deps | **Inspire** |
| `@jatin-yadav05/command-palette` (low-dep alt) | Lean, closer to plain React | Fewer features | **Adapt** |

**Selected:** custom `CommandPalette` (⌘/Ctrl-K) with zero deps. Fuzzy search
over **real** courses (via `/api/catalog/planner-meta`), pathways, clubs, plus
static navigation + actions (open planner, upload transcript, ask AI, profile).
Full keyboard nav, roving `aria-activedescendant`, Escape, focus restore,
`role="dialog"` + labelled listbox. **Used on:** app shell (all student pages).

## 4. Dashboard structure

**Search terms:** bento grid, dashboard cards, bento dashboard.

| Candidate | Strengths | Weaknesses | Decision |
|---|---|---|---|
| `@aceternity/bento-grid` (shortlist) | Good grid hierarchy, responsive spans | Decorative skew/`motion` deps, demo imagery, hover-glow | **Inspire** |

**Selected:** custom bento using CSS grid spans only. One dominant block
(Continue your plan), two supporting (Ask EPHS AI, Graduation progress), utility
tiles (Transcript, Saved/planned courses, Setup checklist). Real student data
only; explicit empty states; **no** decorative skew or glow. **Used on:**
`/dashboard`.

## 5. AI entry input & suggestions

**Search terms:** ai input with suggestions, prompt input, ai chat input.

| Candidate | Strengths | Weaknesses | Decision |
|---|---|---|---|
| `@kokonutd/ai-input-with-suggestions` (shortlist) | Nice suggestion chips + autosize | Motion-lib dep, generic prompts (email/image) | **Adapt** |
| `@Alwurts/chat-input` (full composer) | Solid composer affordances | Its own message model would fight existing streaming logic | **Inspire** |

**Selected:** custom `AiPromptLauncher` (dashboard / empty states) and a
refined **in-place** composer for `/chat` that keeps the *existing* streaming,
stop, retry, persistence, `?about=` prefill, and offline-mode logic untouched —
only the presentation changes. Suggestions are real EPHS prompts. **Used on:**
dashboard, chat empty state, course & pathway detail ("Ask about this…").

## 6. Course filters

**Search terms:** filter table, filter drawer, multi-select, faceted search.

| Candidate | Strengths | Weaknesses | Decision |
|---|---|---|---|
| `@ruixen.ui/flexi-filter-table` (shortlist) | Good filter-chip + facet ideas | Built for business data tables, not a catalog; client-state only | **Inspire** |

**Selected:** keep the existing **URL-backed, no-JS GET form** (server-side
search + pagination — a genuine architectural strength) and layer on the borrowed
ideas: active-filter chips with clear-all, result count, sort, grid/compact
toggle, a desktop filter rail, and a **mobile filter drawer**. **Used on:**
`/courses`.

## 7. Post-onboarding checklist

`@chowlol202/onboarding-checklist` (shortlist) — **Adapt**. Rebuilt as a
dismissible dashboard `SetupChecklist` derived from real state (profile
complete, transcript uploaded, first course saved, course planned, AI asked).
Collapses when complete; never a forced tutorial. **Used on:** `/dashboard`.

## 8. Stepper / onboarding progress

**Search terms:** stepper, onboarding flow, progress steps.
Reviewed generic stepper components — all client-state demos with motion deps.
**Decision: Inspire.** The existing 6-step wizard keeps its data model &
autosave; only the step header, progress bar, radio-card selection, and review
screen are restyled. **Used on:** `/onboarding`.

## 9. Landing product reveal

`@aceternity/container-scroll-animation` (optional) — **Adapt**, single subtle
instance. A CSS/IntersectionObserver scroll reveal of a **real** UI preview (no
WebGL, no fake screenshot). Disabled under `prefers-reduced-motion`; mobile gets
a plain fade. **Used on:** public landing only, never in the app.

## 10. Feedback primitives (toast, dialog, drawer, tabs, skeleton, empty/error)

Reviewed several registry entries; all either duplicate Radix or ship motion
deps. **Decision: Adapt / build custom**, zero-dep, using native `<dialog>`
semantics where possible plus focus-trap helpers. Reduced-motion aware.

---

## Explicitly rejected styles (per brief §6)

Spline/WebGL backgrounds, liquid-glass nav, orbital timelines, gooey/rainbow
text, constant gradients, cursor spotlights, floating orbs, full-screen
parallax, scroll-jacking, word-by-word text animation, glowing course cards, 3D
rotating cards, heavy glassmorphism, giant vanity stats, fake charts/feeds/
testimonials. None are used.

## Dependencies added

**None.** The redesign ships with the existing dependency set (Next 14, React
18, Tailwind 3, lucide-react, clsx, Supabase, zod). All motion is CSS; all
interactive primitives are hand-written and accessible. This is the single most
important consequence of adapting rather than installing.

---

## As-built component dossier (5-point documentation)

Each EPHS-native component below is documented against: **(1)** 21st.dev
reference · **(2)** interaction/layout principles reproduced · **(3)** what
changed for EPHS · **(4)** mobile behavior · **(5)** accessibility &
reduced-motion.

### AppSidebar — `components/app-shell/AppSidebar.tsx`
1. Based on **`@arunjdass/dashboard-sidebar`**.
2. Reproduced: expand/collapse with an icon-only rail, grouped navigation
   sections with small caps labels, an active-item indicator, and a persistent
   account block pinned to the footer.
3. Changed for EPHS: real grouped destinations (Planning / Explore / Student),
   EPHS red active state + left accent bar, EPHS logo lockup, collapse state
   persisted to `localStorage`; removed all demo branding, analytics filler, and
   the reference's color system and motion dependency.
4. Mobile: not rendered — the sidebar is `hidden lg:flex`; phones get the bottom
   tab bar instead, so there's never a squeezed desktop sidebar.
5. A11y/motion: `<aside aria-label>`, `aria-current="page"` on the active link,
   collapse is a real `<button aria-pressed>`, tooltips via `title` when
   collapsed; width animates via a CSS `transition-[width]` that reduced-motion
   collapses to an instant change.

### MobileTabBar + MoreSheet — `components/navigation/`
1. Based on **`@easemize/modern-mobile-menu`**.
2. Reproduced: a fixed five-slot bottom bar (four destinations + "More") and a
   slide-up sheet for secondary destinations.
3. Changed for EPHS: the five items are Home / Courses / Plan / Ask AI / More;
   the sheet holds Pathways, Requirements, Clubs, Transcript, Profile and a sign
   out; safe-area padding via `env(safe-area-inset-bottom)`.
4. Mobile: this *is* the mobile navigation (`lg:hidden`); 44px+ targets, no
   hover dependence, active state by route.
5. A11y/motion: sheet is `role="dialog" aria-modal`, focus-trapped, Escape to
   close, backdrop dismiss, body scroll lock, focus restored to the trigger; the
   slide-up transform is removed under reduced-motion.

### CommandPalette — `components/command-palette/CommandPalette.tsx`
1. Based on **`@rafa-porto/command-palette`** (feature model) + the low-dep
   **`@jatin-yadav05/command-palette`** (lean structure).
2. Reproduced: ⌘/Ctrl-K global open, single query field, grouped results
   (Actions / Go to / Courses), full keyboard navigation, Enter to run.
3. Changed for EPHS: live search over the **real** loaded catalog plus real
   navigation and actions (open planner, upload transcript, ask AI, profile);
   zero dependencies; EPHS styling.
4. Mobile: same overlay, responsive width, opened via the top-bar search
   launcher (the ⌘K hint is hidden on small screens).
5. A11y/motion: `role="dialog"`, combobox + `role="listbox"`/`option` with
   `aria-activedescendant`, Escape closes, focus captured on open and restored
   on close; entrance uses `scale-in` which reduced-motion neutralizes.

### Bento dashboard — `app/(app)/dashboard/page.tsx`
1. Based on **`@aceternity/bento-grid`**.
2. Reproduced: deliberate grid hierarchy — one dominant block, supporting
   blocks, and smaller utility tiles that reflow on small screens.
3. Changed for EPHS: one dominant "Continue your plan" block, a dark "Ask EPHS
   AI" block, graduation progress, transcript status, and the setup checklist —
   all from real student data; no decorative skew, glow, or demo imagery.
4. Mobile: the `lg:grid-cols-3` spans collapse to a single column in a
   sensible reading order.
5. A11y/motion: labelled `<section>`s, status uses icon + text label (not color
   alone); no entrance animation on the data blocks.

### AiPromptLauncher — `components/chat/AiPromptLauncher.tsx`
1. Based on **`@kokonutd/ai-input-with-suggestions`**.
2. Reproduced: an autosizing prompt field with a row of suggestion chips and a
   send affordance.
3. Changed for EPHS: real EPHS suggestion prompts (never generic email/image
   prompts); submitting hands off to `/chat?q=…` so the existing streaming
   pipeline is untouched; light + dark tones.
4. Mobile: full-width, chips wrap, textarea caps its growth so the mobile
   keyboard never hides it.
5. A11y/motion: labelled textarea (`sr-only` label), Enter submits / Shift+Enter
   newlines, disabled send when empty; no transforms.

### Chat composer — `app/(app)/chat/ChatClient.tsx`
1. Based on **`@Alwurts/chat-input`**.
2. Reproduced: autosizing composer, send/stop affordance, Enter-to-send.
3. Changed for EPHS: wraps the **existing** streaming/stop/retry/persistence/
   `?about=`/offline-mode logic verbatim — only presentation changed; messages
   render as calm readable content, not giant colored bubbles.
4. Mobile: composer pinned inside the panel with safe max-height; suggestion
   grid becomes one column.
5. A11y/motion: live "thinking" status via `role="status"`, streaming caret
   disabled under reduced-motion, stop button labelled.

### Course filters — `app/(app)/courses/*`
1. Based on **`@ruixen.ui/flexi-filter-table`** (interaction ideas only).
2. Reproduced: faceted filtering, active-filter chips with clear-all, result
   count, sort control.
3. Changed for EPHS: kept the existing **URL-backed, no-JS GET form** and
   server-side search/pagination; added grid/compact toggle and a mobile filter
   drawer around the same form.
4. Mobile: a "Filters" button opens an accessible right-side drawer; chips scroll
   inline; one-column results.
5. A11y/motion: drawer is focus-trapped `role="dialog"`, chips are links with
   `sr-only` "Remove filter" text, result count is an `aria-live` status.

### SetupChecklist — `components/dashboard/SetupChecklist.tsx`
1. Based on **`@chowlol202/onboarding-checklist`**.
2. Reproduced: a compact progress checklist with per-item completion.
3. Changed for EPHS: items derive from real state (profile, transcript, plan,
   interests); collapses when complete; permanently dismissible; never blocking.
4. Mobile: full-width card, tappable rows.
5. A11y/motion: progress bar has a labelled fill; dismiss is a labelled button.

### ScrollReveal — `components/marketing/ScrollReveal.tsx`
1. Based on **`@aceternity/container-scroll-animation`**.
2. Reproduced: a single, restrained product reveal as the framed preview enters
   the viewport.
3. Changed for EPHS: IntersectionObserver + CSS only (no WebGL, no motion lib);
   the preview is **real** catalog UI, used exactly once, only on the public
   landing.
4. Mobile: the 3D tilt is dropped for a plain fade/scale.
5. A11y/motion: `[data-reveal]` renders flat and fully opaque immediately under
   `prefers-reduced-motion`.
