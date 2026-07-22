import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarRange, GraduationCap, Sparkles, Upload } from "lucide-react";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = { title: "Student Experience Demo" };

/**
 * Public, no-login preview of the student side of EPHS Student Helper.
 *
 * Google sign-in is not yet approved for the school domain, so this route
 * exists solely to let reviewers walk through what a student sees: the
 * onboarding wizard and the dashboard it leads to. It uses sample data and
 * never touches the database, so the real authenticated flow is untouched.
 */
export default function DemoLandingPage() {
  const stops = [
    {
      href: "/demo/onboarding",
      icon: Sparkles,
      step: "01",
      title: "Onboarding",
      body: "The six-step wizard a new student completes on first sign-in — about you, goals, rigor, life & plans, history, and review. Fully interactive.",
      cta: "Start the walkthrough",
    },
    {
      href: "/demo/dashboard",
      icon: GraduationCap,
      step: "02",
      title: "Student dashboard",
      body: "Where onboarding lands: graduation progress, credits earned and in progress, quick actions, and requirement checks — shown with a sample student.",
      cta: "View the dashboard",
    },
    {
      href: "/demo/plan",
      icon: CalendarRange,
      step: "03",
      title: "Four-year planner",
      body: "The full planner across grades 9–12 and the four-term year. Add courses, move them between terms, lock the ones you're sure about, and see live eligibility and prerequisite checks. Edits persist in your browser.",
      cta: "Open the planner",
    },
    {
      href: "/demo/transcript",
      icon: Upload,
      step: "04",
      title: "Transcript upload",
      body: "Upload a real transcript (PDF or image). It runs the same extraction and catalog-matching the live app uses, then confirms your completed courses straight into the four-year plan. Nothing is saved to a server.",
      cta: "Try uploading a transcript",
    },
  ];

  return (
    <div className="space-y-8">
      <DemoBanner />

      <div>
        <p className="kicker text-ep-red">EPHS Student Helper · Preview</p>
        <h1 className="mt-1 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
          See the student experience
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ep-muted">
          Because school Google sign-in is still pending approval, this preview
          lets you step through exactly what a student sees — no account needed.
          Start with onboarding, then land on the dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stops.map((stop) => {
          const Icon = stop.icon;
          return (
            <Link
              key={stop.href}
              href={stop.href}
              className="group relative overflow-hidden rounded-xl border border-ep-border-soft bg-ep-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-ep-red/40 hover:shadow-card-hover"
            >
              <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-ep-faint">
                {stop.step}
              </p>
              <Icon aria-hidden className="mt-3 h-6 w-6 text-ep-red" />
              <h2 className="mt-3 text-xl font-bold tracking-tight text-ep-charcoal">
                {stop.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ep-muted">
                {stop.body}
              </p>
              <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-ep-red-dark">
                {stop.cta}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-dashed border-ep-border bg-ep-card p-4 text-sm text-ep-muted">
        <GraduationCap aria-hidden className="h-5 w-5 shrink-0 text-ep-red" />
        <span>
          Ready for the real thing? The live, persistent login is unchanged —{" "}
          <Link
            href="/login/student"
            className="font-semibold text-ep-red hover:text-ep-red-dark"
          >
            student sign-in
          </Link>{" "}
          still works exactly as before once Google access is approved.
        </span>
      </div>
    </div>
  );
}
