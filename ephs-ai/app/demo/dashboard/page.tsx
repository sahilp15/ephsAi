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
import type { RequirementState } from "@/lib/domain/graduation-rules";
import { StatCard, CounselorVerificationNotice } from "@/components/ui";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = { title: "Student Dashboard Demo" };

/**
 * No-login preview of the student dashboard. This mirrors the real
 * `app/dashboard/page.tsx` markup exactly, but renders a fixed sample student
 * instead of calling `requireStudent()` / the database. It exists so reviewers
 * can see the student experience while Google sign-in approval is pending; the
 * authenticated dashboard is untouched.
 */

const STATE_STYLE: Record<RequirementState, { icon: typeof CheckCircle2; className: string }> = {
  satisfied: { icon: CheckCircle2, className: "text-emerald-700" },
  open: { icon: CircleDashed, className: "text-amber-700" },
  needs_confirmation: { icon: HelpCircle, className: "text-ep-muted" },
};

const QUICK_ACTIONS = [
  { href: "/courses", label: "Browse courses", icon: BookOpen },
  { href: "/demo/plan", label: "Open planner", icon: CalendarRange },
  { href: "/demo/transcript", label: "Upload transcript", icon: Upload },
  { href: "/chat", label: "Ask EPHS AI", icon: MessageCircle },
];

// Sample student used only for the preview.
const DEMO = {
  name: "Alex",
  currentGrade: 10,
  graduationYear: 2029,
  creditsEarned: 12,
  creditsInProgress: 6,
  plannedCount: 8,
  requirements: [
    {
      id: "arts-requirement",
      title: "Arts requirement",
      state: "satisfied" as RequirementState,
      detail: "Met with Ceramics 1 and Concert Band.",
    },
    {
      id: "technology-credit",
      title: "Technology credit (Class of 2029)",
      state: "satisfied" as RequirementState,
      detail: "Met with Intro to Computer Science.",
    },
    {
      id: "personal-finance-credit",
      title: "Personal finance credit (Class of 2028 and beyond)",
      state: "open" as RequirementState,
      detail: "Not yet planned. Add a qualifying course to satisfy this.",
    },
    {
      id: "full-credit-audit",
      title: "Complete credit audit (all subject areas)",
      state: "needs_confirmation" as RequirementState,
      detail: "Upload or confirm your transcript for a full audit.",
    },
  ],
};

export default function DemoDashboardPage() {
  const {
    name,
    currentGrade,
    graduationYear,
    creditsEarned,
    creditsInProgress,
    plannedCount,
    requirements,
  } = DEMO;
  const satisfied = requirements.filter((i) => i.state === "satisfied").length;

  return (
    <div className="space-y-8">
      <DemoBanner />

      <div>
        <p className="kicker text-ep-red">EPHS AI</p>
        <h1 className="mt-1 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-ep-muted">
          Grade {currentGrade} · Class of {graduationYear}
        </p>
      </div>

      <Link
        href="/demo/transcript"
        className="flex items-center gap-3 rounded-xl border-l-4 border-ep-red bg-ep-red-soft p-4 text-sm text-ep-red-dark transition-colors hover:bg-ep-red-soft/70"
      >
        <FileText className="h-5 w-5 flex-shrink-0" aria-hidden />
        <span>
          Upload your transcript to see your completed courses matched to the
          EPHS catalog and added to your four-year plan.
        </span>
      </Link>

      <section aria-label="Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Credits earned" value={creditsEarned} hint="From confirmed history" />
        <StatCard label="Credits in progress" value={creditsInProgress} />
        <StatCard label="Courses planned" value={plannedCount} hint="Future terms" />
        <StatCard label="Requirements met" value={`${satisfied}/${requirements.length}`} hint="Verified categories" />
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
          {requirements.map((item) => {
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

      <div className="flex items-center gap-3 text-sm">
        <Link href="/demo/onboarding" className="inline-flex items-center gap-1.5 font-semibold text-ep-muted hover:text-ep-charcoal">
          <Settings className="h-4 w-4" /> Edit profile & onboarding
        </Link>
      </div>

      <CounselorVerificationNotice />
    </div>
  );
}
