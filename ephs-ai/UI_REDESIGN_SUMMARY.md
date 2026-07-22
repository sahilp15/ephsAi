# EPHS AI — UI Redesign Summary

## 1. Summary of changes
A complete, production-quality UI/UX redesign that evolves EPHS's identity from
"varsity editorial" to a calm, premium **academic-editorial** system while
preserving all functionality. New design tokens and primitives; four dedicated
route-group shells (public, focused, student app, staff); a collapsible desktop
sidebar, compact top bar, ⌘K command palette, and mobile bottom navigation; and
redesigned dashboard, course explorer, course detail, chat, onboarding,
requirements, pathways, clubs, transcript, planner, landing, and auth surfaces.
Typecheck, 114 tests, and the production build stay green.

## 2. Selected 21st.dev components (adapted → EPHS-native, zero-dep)
Sidebar `@arunjdass/dashboard-sidebar` · mobile menu `@easemize/modern-mobile-menu`
· command palette `@rafa-porto/command-palette` + `@jatin-yadav05/command-palette`
· bento `@aceternity/bento-grid` · AI input `@kokonutd/ai-input-with-suggestions`
· composer `@Alwurts/chat-input` · filters `@ruixen.ui/flexi-filter-table` ·
checklist `@chowlol202/onboarding-checklist` · reveal
`@aceternity/container-scroll-animation`. Full 5-point dossier in
`21ST_COMPONENT_RESEARCH.md`.

## 3. Rejected components
Generic admin-sidebar/tab-bar templates and every rejected §6 style (Spline/WebGL,
liquid-glass, orbital timelines, gooey/rainbow text, constant gradients, cursor
spotlights, orbs, parallax/scroll-jacking, word-by-word text, glowing/3D cards,
heavy glassmorphism, vanity stats, fake charts/feeds/testimonials).

## 4. Components adapted rather than copied
All of them — the registry could not be authenticated in this sandbox (see the
research doc's tooling note), so every pattern was rebuilt as custom EPHS-native
code with EPHS tokens, real data, and no author demo content.

## 5. Dependencies added
**None.**

## 6. Dependencies avoided
Framer Motion / Motion / GSAP and any micro-animation libraries — all motion is
CSS. No cmdk, no headless-UI, no new icon set.

## 7. Files created (selected)
`components/app-shell/{AppShell,AppSidebar,AppTopbar}.tsx`,
`components/navigation/{nav-config,PublicHeader,MobileTabBar,MoreSheet}.tsx`,
`components/command-palette/CommandPalette.tsx`,
`components/auth/ShellAccount.tsx`, `components/chat/AiPromptLauncher.tsx`,
`components/dashboard/SetupChecklist.tsx`, `components/marketing/ScrollReveal.tsx`,
`app/(marketing|focused|app|staff)/layout.tsx`,
`app/(app)/courses/MobileFilterDrawer.tsx`, plus this doc, `UI_REDESIGN_PLAN.md`,
and `21ST_COMPONENT_RESEARCH.md`.

## 8. Files significantly modified
`tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `components/ui.tsx`,
`components/{Footer,CourseCard,EPHSLogo,AddToPlan}.tsx`, all `app/(app)/*` pages
+ `ChatClient`/`PlannerClient`/`RequirementsClient`/`FilterSidebar`,
`app/(marketing)/page.tsx`, `AuthLoginCard`, `OnboardingWizard`, clubs/transcript
components, `lib/catalog/search.ts` (additive `sort`). ~45 files modified, ~19
created; whole app relocated into route groups (URLs unchanged).

## 9. Existing functionality preserved
Auth/RLS/middleware, server actions, student context, onboarding data model +
autosave, URL-backed catalog search + pagination, course data, planner DnD +
validation + persistence, graduation rules, transcript pipeline, clubs, AI
grounding/streaming/stop/retry/persistence/citations/offline mode, counselor +
admin features, API routes, env structure, and all 114 tests.

## 10. Accessibility improvements
Skip link + semantic landmarks; `aria-current` nav; focus-trapped, Escape-closing,
focus-restoring dialogs/drawers/palette; combobox/listbox palette semantics;
visible focus rings; icon+text status (never color-only); labelled inputs; 44px+
mobile targets; reduced-motion removes transforms.

## 11. Performance
Zero new client dependencies; motion is CSS; server components stay server-side
(shells isolate the few client islands); catalog search + pagination remain
server-side; shared JS bundle unchanged at ~87 kB.

## 12. Tests completed
`npm run typecheck` ✓ · `npm run test` ✓ (114/114) · `npm run build` ✓ · Playwright
visual QA (desktop 1440 + mobile 390) of landing, courses, chat, command palette,
and login.

## 13. Build result
Production build succeeds (one pre-existing `pdfjs-dist` `createRequire` warning,
unrelated to this work). All routes compile; SSG course/pathway pages intact.

## 14. Known limitations
21st.dev registry could not be authenticated here, so components are adapted (not
installed) — documented transparently. Course titles render in the guide's own
casing (often ALL-CAPS) to stay faithful to the source. Authenticated pages
require Supabase env to render (unchanged behavior); visual QA covered public
routes. Staff pages received a lighter (token-level) restyle than the student core.

## 15. Remaining backend work
None required for the redesign — it is presentation-only over the existing
backend. Optional future polish: extend the command palette with a small
pathways/clubs search endpoint, and add a first-class "save course" model.

## 16. Commands to run the project
```bash
cd ephs-ai
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run test       # vitest (114 tests)
npm run build && npm start
```
Add `OPENAI_API_KEY` (+ Supabase env) in `ephs-ai/.env.local` for live AI and
accounts; without them the app runs in catalog-lookup / public mode.
