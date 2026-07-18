import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  FileText,
  HelpCircle,
  MessageCircle,
  Settings,
  Upload,
} from "lucide-react";
import { requireStudent } from "@/lib/auth/session";
import { buildStudentGraduation } from "@/lib/data/graduation";
import { listTranscripts } from "@/lib/data/academic";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";
import type { RequirementState } from "@/lib/domain/graduation-rules";
import { StatCard, CounselorVerificationNotice } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATE_STYLE: Record<RequirementState, { icon: typeof CheckCircle2; className: string }> = {
  satisfied: { icon: CheckCircle2, className: "text-emerald-700" },
  open: { icon: CircleDashed, className: "text-amber-700" },
  needs_confirmation: { icon: HelpCircle, className: "text-ep-muted" },
};

const QUICK_ACTIONS = [
  { href: "/courses", label: "Browse courses", icon: BookOpen },
  { href: "/plan", label: "Open planner", icon: CalendarRange },
  { href: "/transcript", label: "Upload transcript", icon: Upload },
  { href: "/chat", label: "Ask EPHS AI", icon: MessageCircle },
];

export default async function DashboardPage() {
  const user = await requireStudent();
  const p = user.profile;
  const graduationYear = p?.graduation_year ?? DEFAULT_PROFILE.graduationYear;
  const currentGrade = p?.current_grade ?? DEFAULT_PROFILE.currentGrade;

  const [grad, transcripts] = await Promise.all([
    buildStudentGraduation(user.id, graduationYear),
    listTranscripts(user.id),
  ]);

  const name = p?.preferred_first_name || user.displayName.split(" ")[0] || "there";
  const historyCount = grad.state.projection.completedCourseIds.length;
  const plannedCount = grad.state.future.length;
  const satisfied = grad.report.items.filter((i) => i.state === "satisfied").length;
  const hasTranscript = transcripts.length > 0;
  const unconfirmed = transcripts.filter((t) => t.status === "processed").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker text-ep-red">EPHS AI</p>
        <h1 className="mt-1 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-ep-muted">
          Grade {currentGrade} · Class of {graduationYear}
        </p>
      </div>

      {unconfirmed > 0 ? (
        <Link
          href="/transcript"
          className="flex items-center gap-3 rounded-xl border-l-4 border-ep-red bg-ep-red-soft p-4 text-sm text-ep-red-dark transition-colors hover:bg-ep-red-soft/70"
        >
          <FileText className="h-5 w-5 flex-shrink-0" aria-hidden />
          <span>
            You have a transcript ready to review. Confirm your courses so they
            count toward your plan and graduation progress.
          </span>
        </Link>
      ) : null}

      <section aria-label="Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Credits earned" value={grad.creditsEarned} hint="From confirmed history" />
        <StatCard label="Credits in progress" value={grad.creditsInProgress} />
        <StatCard label="Courses planned" value={plannedCount} hint="Future terms" />
        <StatCard label="Requirements met" value={`${satisfied}/${grad.report.items.length}`} hint="Verified categories" />
      </section>

      <section aria-label="Quick actions">
        <h2 className="mb-3 text-lg font-bold text-ep-charcoal">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2.5 rounded-xl border border-ep-border-soft bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <Icon className="h-5 w-5 text-ep-red" aria-hidden />
                <span className="text-sm font-semibold text-ep-charcoal">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Graduation progress">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ep-charcoal">Graduation progress</h2>
          <Link href="/requirements" className="text-sm font-semibold text-ep-red hover:text-ep-red-dark">
            View details →
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {grad.report.items.map((item) => {
            const meta = STATE_STYLE[item.state];
            const Icon = meta.icon;
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-ep-border-soft bg-white p-3.5 shadow-card"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.className}`} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-ep-charcoal">{item.title}</p>
                  <p className="text-sm text-ep-muted">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {!hasTranscript && historyCount === 0 ? (
        <section className="rounded-xl border border-dashed border-ep-border bg-white p-6 text-center">
          <p className="font-display text-lg font-bold uppercase text-ep-charcoal">
            Start building your history
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ep-muted">
            Upload your transcript to import completed courses automatically, or
            add them by hand — then plan the rest of your four years.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/transcript" className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark">
              Upload transcript
            </Link>
            <Link href="/plan" className="rounded-lg border border-ep-border bg-white px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg">
              Open planner
            </Link>
          </div>
        </section>
      ) : null}

      <div className="flex items-center gap-3 text-sm">
        <Link href="/profile" className="inline-flex items-center gap-1.5 font-semibold text-ep-muted hover:text-ep-charcoal">
          <Settings className="h-4 w-4" /> Edit profile & onboarding
        </Link>
      </div>

      <CounselorVerificationNotice />
    </div>
  );
}
