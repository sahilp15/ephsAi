import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  FileText,
  GraduationCap,
  HelpCircle,
  LibraryBig,
  Upload,
} from "lucide-react";
import { requireStudent } from "@/lib/auth/session";
import { buildStudentGraduation } from "@/lib/data/graduation";
import { listTranscripts } from "@/lib/data/academic";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";
import type { RequirementState } from "@/lib/domain/graduation-rules";
import { CounselorVerificationNotice, ProgressBar } from "@/components/ui";
import { AiPromptLauncher } from "@/components/chat/AiPromptLauncher";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATE_STYLE: Record<
  RequirementState,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  satisfied: { icon: CheckCircle2, className: "text-ep-success", label: "Satisfied" },
  open: { icon: CircleDashed, className: "text-ep-warn", label: "Still needed" },
  needs_confirmation: {
    icon: HelpCircle,
    className: "text-ep-info",
    label: "Confirm",
  },
};

export default async function DashboardPage() {
  const user = await requireStudent();
  const p = user.profile;
  const graduationYear = p?.graduation_year ?? DEFAULT_PROFILE.graduationYear;
  const currentGrade = p?.current_grade ?? DEFAULT_PROFILE.currentGrade;

  const [grad, transcripts] = await Promise.all([
    buildStudentGraduation(user.id, graduationYear),
    listTranscripts(user.id),
  ]);

  const name =
    p?.preferred_first_name || user.displayName.split(" ")[0] || "there";
  const historyCount = grad.state.projection.completedCourseIds.length;
  const plannedCount = grad.state.future.length;
  const totalReq = grad.report.items.length;
  const satisfied = grad.report.items.filter((i) => i.state === "satisfied").length;
  const hasTranscript = transcripts.length > 0;
  const unconfirmed = transcripts.filter((t) => t.status === "processed").length;

  const statusSentence =
    plannedCount > 0
      ? `You have ${plannedCount} course${plannedCount === 1 ? "" : "s"} planned and ${grad.creditsEarned} credit${grad.creditsEarned === 1 ? "" : "s"} earned so far.`
      : historyCount > 0
        ? `You've logged ${historyCount} completed course${historyCount === 1 ? "" : "s"}. Next, map out the terms ahead.`
        : "Let's start building your four-year plan.";

  const aiSuggestions = [
    `Which AP courses can I take in grade ${currentGrade}?`,
    "Which graduation requirements am I missing?",
    "Help me plan next year's schedule.",
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header>
        <p className="kicker">Dashboard</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ep-charcoal sm:text-4xl">
          Welcome back, {name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ep-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ep-border bg-ep-card px-2.5 py-0.5 text-xs font-medium">
            <GraduationCap aria-hidden className="h-3.5 w-3.5 text-ep-red" />
            Grade {currentGrade} · Class of {graduationYear}
          </span>
          <span>{statusSentence}</span>
        </div>
      </header>

      {unconfirmed > 0 ? (
        <Link
          href="/transcript"
          className="flex items-center gap-3 rounded-xl border-l-4 border-ep-red bg-ep-red-soft p-4 text-sm text-ep-red-dark transition-colors hover:bg-ep-red-soft/70"
        >
          <FileText className="h-5 w-5 shrink-0" aria-hidden />
          <span>
            You have a transcript ready to review. Confirm your courses so they
            count toward your plan and graduation progress.
          </span>
          <ArrowRight aria-hidden className="ml-auto h-4 w-4 shrink-0" />
        </Link>
      ) : null}

      {/* Bento row 1: dominant plan block + AI */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Continue your plan — dominant */}
        <section className="relative overflow-hidden rounded-2xl border border-ep-border-soft bg-ep-card p-6 shadow-card lg:col-span-2">
          <p className="kicker">Continue your four-year plan</p>
          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="text-4xl font-bold leading-none tracking-tight text-ep-charcoal">
                {plannedCount}
              </p>
              <p className="mt-1 text-xs text-ep-muted">Courses planned</p>
            </div>
            <div>
              <p className="text-4xl font-bold leading-none tracking-tight text-ep-charcoal">
                {grad.creditsEarned}
              </p>
              <p className="mt-1 text-xs text-ep-muted">Credits earned</p>
            </div>
            <div>
              <p className="text-4xl font-bold leading-none tracking-tight text-ep-charcoal">
                {grad.creditsInProgress}
              </p>
              <p className="mt-1 text-xs text-ep-muted">In progress</p>
            </div>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ep-muted">
            {plannedCount > 0
              ? "Pick up where you left off — review eligibility and prerequisite checks across all four grades."
              : "Map courses across grades 9–12 with automatic eligibility and prerequisite checks after every change."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 rounded-lg bg-ep-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
            >
              <CalendarRange aria-hidden className="h-4 w-4" />
              {plannedCount > 0 ? "Open your plan" : "Start planning"}
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-ep-border bg-ep-card px-4 py-2.5 text-sm font-semibold text-ep-charcoal transition-colors hover:bg-ep-bg-sunken"
            >
              Browse courses
            </Link>
          </div>
        </section>

        {/* Ask the Helper — dark supporting block */}
        <section className="flex flex-col rounded-2xl bg-ep-coal p-5 text-white shadow-card">
          <p className="kicker text-ep-red">Ask the Helper</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Grounded in the official Course Guide. Ask about eligibility,
            requirements, or pathways.
          </p>
          <AiPromptLauncher
            tone="dark"
            className="mt-4"
            placeholder="Ask a question…"
            suggestions={aiSuggestions}
          />
        </section>
      </div>

      {/* Bento row 2: graduation progress + utility rail */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section
          aria-label="Graduation progress"
          className="rounded-2xl border border-ep-border-soft bg-ep-card p-5 shadow-card lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ep-charcoal">
              Graduation progress
            </h2>
            <Link
              href="/requirements"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ep-red-dark hover:text-ep-red"
            >
              Details <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={satisfied}
              max={totalReq}
              tone="success"
              label={`${satisfied} of ${totalReq} requirement categories verified`}
              showCount={false}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {grad.report.items.map((item) => {
              const meta = STATE_STYLE[item.state];
              const Icon = meta.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-ep-border-soft bg-ep-bg/50 p-3"
                >
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${meta.className}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ep-charcoal">
                      {item.title}
                    </p>
                    <p className="text-sm text-ep-muted">{item.detail}</p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-4">
          {/* Transcript status */}
          <section className="rounded-2xl border border-ep-border-soft bg-ep-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <LibraryBig aria-hidden className="h-4 w-4 text-ep-red" />
              <h2 className="text-sm font-bold text-ep-charcoal">Transcript</h2>
            </div>
            {hasTranscript || historyCount > 0 ? (
              <>
                <p className="mt-2 text-sm text-ep-muted">
                  {historyCount} completed course{historyCount === 1 ? "" : "s"}{" "}
                  on record
                  {unconfirmed > 0 ? `, ${unconfirmed} awaiting confirmation` : ""}.
                </p>
                <Link
                  href="/transcript"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ep-red-dark hover:text-ep-red"
                >
                  Manage transcript
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ep-muted">
                  Import completed courses automatically so they count toward
                  your plan.
                </p>
                <Link
                  href="/transcript"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-3 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
                >
                  <Upload aria-hidden className="h-4 w-4" /> Upload transcript
                </Link>
              </>
            )}
          </section>

          {/* Setup checklist */}
          <SetupChecklist hasTranscript={hasTranscript} />
        </div>
      </div>

      <CounselorVerificationNotice />
    </div>
  );
}
