import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Compass,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { getCourses, getDataset, getPathways } from "@/lib/catalog/store";
import { CounselorVerificationNotice, StatCard } from "@/components/ui";

export default function LandingPage() {
  const dataset = getDataset();
  const courseCount = getCourses().length;
  const pathwayCount = getPathways().length;

  const features = [
    {
      icon: BookOpen,
      title: "Real course catalog",
      body: `All ${courseCount} structured courses from the official guide: descriptions, prerequisites, credits, grades, and page citations.`,
      href: "/courses",
      cta: "Browse courses",
    },
    {
      icon: CalendarRange,
      title: "Four-year planner",
      body: "Plan all four grades across EPHS's four-term year, with automatic eligibility and prerequisite checks after every change.",
      href: "/plan",
      cta: "Open planner",
    },
    {
      icon: GraduationCap,
      title: "Requirement checks",
      body: "Verified graduation rules for your class year, including the Class of 2027 technology rule and the Class of 2028+ personal finance rule.",
      href: "/requirements",
      cta: "Check requirements",
    },
    {
      icon: Compass,
      title: "Five official pathways",
      body: "Explore capstones and supporting courses for every EPHS pathway and see how your plan aligns.",
      href: "/pathways",
      cta: "Explore pathways",
    },
    {
      icon: ShieldCheck,
      title: "Privacy first",
      body: "Your plan stays on your device. Assistant requests carry anonymized planning context only.",
      href: "/privacy",
      cta: "Read the notice",
    },
  ];

  return (
    <div className="space-y-14">
      {/* ===== hero: the assistant ===== */}
      <section className="panel-grain relative overflow-hidden rounded-2xl bg-ep-coal px-6 py-12 text-white shadow-panel sm:px-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-up">
            <p className="kicker text-white/50">
              Eden Prairie High School · 2026-27
            </p>
            <h1 className="mt-3 text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              Every course.
              <br />
              Every requirement.
              <br />
              <span className="text-ep-red">One assistant.</span>
            </h1>
            <span className="wing-stripes mt-5" aria-hidden>
              <i /><i /><i />
            </span>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
              Chat with an assistant built only on the official{" "}
              {dataset.generated_from.document_title}. It cites its pages, checks
              your eligibility, and never makes things up.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login/student"
                className="inline-flex -skew-x-12 items-center rounded-[3px] bg-ep-red px-6 py-3 shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-colors hover:bg-ep-red-dark"
              >
                <span className="flex skew-x-12 items-center gap-2 font-display text-lg font-bold uppercase tracking-wider text-white">
                  <GraduationCap aria-hidden className="h-5 w-5" />
                  Student Login
                </span>
              </Link>
              <Link
                href="/login/admin"
                className="inline-flex -skew-x-12 items-center rounded-[3px] border border-white/25 bg-white/5 px-6 py-3 transition-colors hover:bg-white/10"
              >
                <span className="flex skew-x-12 items-center gap-2 font-display text-lg font-bold uppercase tracking-wider text-white/85">
                  <ShieldCheck aria-hidden className="h-5 w-5" />
                  Admin Login
                </span>
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 font-semibold text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                <MessageCircle aria-hidden className="h-4 w-4" /> Ask EPHS AI
              </Link>
              <Link
                href="/courses"
                className="font-semibold text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Browse the catalog
              </Link>
            </div>
          </div>

          {/* chat preview */}
          <div
            className="animate-fade-up overflow-hidden rounded-xl bg-white text-ep-charcoal shadow-panel [animation-delay:120ms]"
            aria-label="Example conversation with the EPHS AI Assistant"
          >
            <div className="flex items-center gap-2.5 bg-ep-charcoal px-4 py-2.5 text-white">
              <span
                aria-hidden
                className="flex h-7 w-8 -skew-x-12 items-center justify-center rounded-[3px] bg-ep-red"
              >
                <span className="skew-x-12 font-display text-xs font-bold">EP</span>
              </span>
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                EPHS AI Assistant
              </p>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">
                Live · grounded
              </span>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-ep-coal px-3.5 py-2 text-[13px] text-white">
                Can I take AP Computer Science A next year?
              </div>
              <div className="max-w-[92%] rounded-xl rounded-bl-sm bg-ep-bg px-3.5 py-2.5 text-[13px] leading-relaxed text-ep-ink">
                <p>
                  The guide lists{" "}
                  <strong>AP Computer Science A (Java) A &amp; B</strong> for
                  grades 9-12, with the stated prerequisite{" "}
                  <em>&quot;AP Computer Science Principles.&quot;</em> Have you
                  taken it?
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

      {/* ===== scoreboard ===== */}
      <section
        aria-label="Catalog statistics"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Structured courses"
          value={courseCount}
          hint="From the official guide"
        />
        <StatCard label="Official pathways" value={pathwayCount} hint="With capstones" />
        <StatCard
          label="Source pages"
          value={dataset.generated_from.page_count}
          hint="Every fact is page-cited"
        />
        <StatCard label="Terms per year" value={4} hint="EPHS four-term model" />
      </section>

      {/* ===== features ===== */}
      <section aria-label="Features">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold uppercase leading-none text-ep-charcoal sm:text-4xl">
            The whole guide,
            <span className="text-ep-red"> working for you</span>
          </h2>
          <span className="wing-stripes mb-1 hidden sm:inline-flex" aria-hidden>
            <i /><i /><i />
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const FeatureIcon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative overflow-hidden rounded-xl border border-ep-border-soft bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-ep-red/40 hover:shadow-card-hover"
              >
                <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-ep-faint">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <FeatureIcon aria-hidden className="mt-3 h-6 w-6 text-ep-red" />
                <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-ep-charcoal">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ep-muted">
                  {feature.body}
                </p>
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-ep-red-dark opacity-0 transition-opacity group-hover:opacity-100">
                  {feature.cta}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </p>
              </Link>
            );
          })}
          {/* assistant card, dark, completes the grid */}
          <Link
            href="/chat"
            className="group panel-grain relative overflow-hidden rounded-xl bg-ep-coal p-5 text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-white/40">
              06
            </p>
            <MessageCircle aria-hidden className="mt-3 h-6 w-6 text-ep-red" />
            <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-wide">
              The EPHS AI Assistant
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              Trained on EPHS data only. Ask in plain language, get cited
              answers, and know when to see your counselor.
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-ep-red">
              Start chatting
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </p>
          </Link>
        </div>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
