import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Compass,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCourses, getDataset, getPathways } from "@/lib/catalog/store";
import { CourseCard } from "@/components/CourseCard";
import { AiPromptLauncher } from "@/components/chat/AiPromptLauncher";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { CounselorVerificationNotice } from "@/components/ui";

const HERO_SUGGESTIONS = [
  "What can I take after Geometry?",
  "Which graduation requirements am I missing?",
  "Help me build a computer science pathway.",
];

export default function LandingPage() {
  const dataset = getDataset();
  const courses = getCourses();
  const courseCount = courses.length;
  const pathwayCount = getPathways().length;

  // Real catalog courses for the product preview — AP courses read well, fall
  // back to the first few so the preview is never empty or fabricated.
  const apCourses = courses.filter((c) => c.flags.ap);
  const preview = (apCourses.length >= 3 ? apCourses : courses).slice(0, 3);

  const capabilities = [
    {
      icon: BookOpen,
      title: "Explore the real catalog",
      body: `All ${courseCount} courses from the official guide — descriptions, prerequisites, credits, grades, and page citations.`,
      href: "/courses",
      cta: "Browse courses",
    },
    {
      icon: CalendarRange,
      title: "Build your four-year plan",
      body: "Plan grades 9–12 across the four-term year, with automatic eligibility and prerequisite checks after every change.",
      href: "/login/student",
      cta: "Start planning",
    },
    {
      icon: GraduationCap,
      title: "Check requirements & pathways",
      body: `Verified graduation rules for your class year and ${pathwayCount} official pathways with capstones.`,
      href: "/requirements",
      cta: "See requirements",
    },
  ];

  const steps = [
    { n: "01", title: "Sign in", body: "Use your school Google account to load your profile and history." },
    { n: "02", title: "Bring your history", body: "Upload a transcript or add completed courses — they flow into your plan." },
    { n: "03", title: "Plan & ask", body: "Map future terms and ask the assistant anything, grounded in the guide." },
  ];

  return (
    <div className="space-y-20">
      {/* ===== Hero ===== */}
      <section className="pt-6 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-up">
            <p className="kicker">Eden Prairie High School · 2026-27</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-ep-charcoal sm:text-5xl lg:text-6xl">
              Plan your path <br className="hidden sm:block" />
              through EPHS.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ep-muted">
              Explore courses, check requirements, build your four-year plan, and
              get answers grounded in the official{" "}
              {dataset.generated_from.document_title}.
            </p>

            <div className="mt-6 max-w-lg">
              <AiPromptLauncher suggestions={HERO_SUGGESTIONS} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login/student"
                className="inline-flex items-center gap-2 rounded-lg bg-ep-red px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-ep-red-dark"
              >
                <GraduationCap aria-hidden className="h-4 w-4" />
                Student sign in
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg border border-ep-border bg-ep-card px-5 py-3 text-sm font-semibold text-ep-charcoal transition-colors hover:bg-ep-bg-sunken"
              >
                Browse the catalog
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ep-muted">
              <span>
                <span className="font-semibold text-ep-charcoal">{courseCount}</span>{" "}
                courses
              </span>
              <span>
                <span className="font-semibold text-ep-charcoal">{pathwayCount}</span>{" "}
                pathways
              </span>
              <span>
                <span className="font-semibold text-ep-charcoal">
                  {dataset.generated_from.page_count}
                </span>{" "}
                source pages
              </span>
            </div>
          </div>

          {/* Chat preview card */}
          <div className="animate-fade-up overflow-hidden rounded-2xl border border-ep-border-soft bg-ep-card shadow-pop [animation-delay:100ms]">
            <div className="flex items-center gap-2.5 border-b border-ep-border-soft px-4 py-3">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-ep-red text-white"
              >
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold text-ep-charcoal">
                EPHS Student Helper
              </p>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ep-muted">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ep-success" />
                Live · grounded
              </span>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ep-charcoal px-3.5 py-2 text-[13px] text-white">
                Can I take AP Computer Science A next year?
              </div>
              <div className="max-w-[92%] text-[13px] leading-relaxed text-ep-ink">
                <p>
                  The guide lists{" "}
                  <strong>AP Computer Science A (Java) A &amp; B</strong> for
                  grades 9–12, with the stated prerequisite{" "}
                  <em>“AP Computer Science Principles.”</em> Have you taken it?
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-ep-faint">
                  Source: Guide, pp. 16, 33
                </p>
              </div>
            </div>
            <Link
              href="/chat"
              className="flex items-center justify-between border-t border-ep-border-soft px-4 py-3 text-sm font-semibold text-ep-red-dark transition-colors hover:bg-ep-red-soft"
            >
              Ask your own question
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Product reveal (real catalog UI) ===== */}
      <section aria-label="Product preview">
        <div className="text-center">
          <p className="kicker justify-center">The real product</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ep-charcoal sm:text-3xl">
            Real courses. Real data. No guesswork.
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-sm text-ep-muted">
            This is the actual catalog interface — every card below is a real
            EPHS course with its official description and page citation.
          </p>
        </div>
        <ScrollReveal className="mt-8">
          <div className="rounded-2xl border border-ep-border bg-ep-bg-sunken/60 p-4 shadow-pop sm:p-6">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((c) => (
                <li key={c.id}>
                  <CourseCard course={c} />
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== Capabilities ===== */}
      <section aria-label="What you can do">
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="flex flex-col rounded-2xl border border-ep-border-soft bg-ep-card p-5 shadow-card"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-ep-red-soft text-ep-red"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-ep-charcoal">
                  {c.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ep-muted">
                  {c.body}
                </p>
                <Link
                  href={c.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ep-red-dark hover:text-ep-red"
                >
                  {c.cta}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section aria-label="How it works">
        <h2 className="text-2xl font-bold tracking-tight text-ep-charcoal sm:text-3xl">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-ep-border-soft bg-ep-card p-5 shadow-card"
            >
              <p className="font-mono text-xs font-semibold tracking-[0.2em] text-ep-red">
                {s.n}
              </p>
              <h3 className="mt-3 text-base font-bold text-ep-charcoal">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ep-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Trust ===== */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Grounded in the guide",
            body: "Every course fact and citation comes from the official 2026-27 Course Guide — nothing invented.",
          },
          {
            icon: ShieldCheck,
            title: "Privacy first",
            body: "Your plan stays on your device. Assistant requests carry anonymized planning context only.",
          },
          {
            icon: MessageCircle,
            title: "Knows its limits",
            body: "When the guide doesn't say, the assistant says so and points you to your counselor.",
          },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.title}
              className="rounded-2xl border border-ep-border-soft bg-ep-card p-5 shadow-card"
            >
              <Icon aria-hidden className="h-5 w-5 text-ep-red" />
              <h3 className="mt-3 text-base font-bold text-ep-charcoal">
                {t.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ep-muted">
                {t.body}
              </p>
            </div>
          );
        })}
      </section>

      {/* ===== Entry points + final CTA ===== */}
      <section className="overflow-hidden rounded-2xl bg-ep-coal p-8 text-white shadow-panel sm:p-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to plan your four years?
          </h2>
          <p className="mt-3 text-white/70">
            Students, sign in with your school account. Staff can reach the
            counselor and administrator tools from here too.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login/student"
            className="inline-flex items-center gap-2 rounded-lg bg-ep-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
          >
            <GraduationCap aria-hidden className="h-4 w-4" /> Student sign in
          </Link>
          <Link
            href="/login/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ShieldCheck aria-hidden className="h-4 w-4" /> Administrator
          </Link>
          <Link
            href="/counselor"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Compass aria-hidden className="h-4 w-4" /> Counselor
          </Link>
        </div>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
