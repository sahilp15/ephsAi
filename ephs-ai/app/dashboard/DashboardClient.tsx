"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BookOpen,
  CalendarRange,
  Compass,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import { validatePlan } from "@/lib/domain/plan-validation";
import {
  CounselorVerificationNotice,
  EmptyState,
  StatCard,
  WarningBanner,
} from "@/components/ui";

export function DashboardClient({
  pathways,
}: {
  pathways: Array<{ id: string; name: string }>;
}) {
  const { profile, plan, ready, metaReady, catalogMeta } = useStudent();

  const warnings = useMemo(
    () =>
      metaReady
        ? validatePlan({
            entries: plan,
            profile: {
              graduationYear: profile.graduationYear,
              currentGrade: profile.currentGrade,
              completedCourseIds: profile.completedCourseIds,
            },
            catalog: catalogMeta,
          })
        : [],
    [metaReady, plan, profile, catalogMeta],
  );

  if (!ready) {
    return (
      <p role="status" className="text-sm text-ep-muted">
        Loading…
      </p>
    );
  }

  if (!profile.onboardingCompleted) {
    return (
      <EmptyState
        title="Welcome to EPHS AI"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/onboarding"
              className="rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-ep-red-dark"
            >
              Set up my profile
            </Link>
            <Link
              href="/counselor"
              className="rounded-lg border border-ep-border bg-white px-5 py-2.5 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
            >
              Try a demo student
            </Link>
          </div>
        }
      >
        Set up a quick planning profile, or load a fictional demo student to
        explore the app.
      </EmptyState>
    );
  }

  const plannedCount = plan.filter((e) => e.status === "planned").length;
  const importantWarnings = warnings.filter((w) => w.severity !== "info");
  const selectedPathways = pathways.filter((p) =>
    profile.pathwayIds.includes(p.id),
  );

  const quickActions = [
    { href: "/courses", label: "Browse courses", icon: BookOpen },
    { href: "/plan", label: "Open planner", icon: CalendarRange },
    { href: "/chat", label: "Ask EPHS AI", icon: Sparkles },
    { href: "/onboarding", label: "Edit profile", icon: UserRound },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
          {profile.displayName
            ? `Welcome back, ${profile.displayName}`
            : "Your dashboard"}
        </h1>
        <p className="mt-1 text-sm text-ep-muted">
          Grade {profile.currentGrade} · Class of {profile.graduationYear}
        </p>
      </div>

      <section aria-label="Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current grade" value={profile.currentGrade} />
        <StatCard label="Class of" value={profile.graduationYear} />
        <StatCard label="Courses planned" value={plannedCount} hint="Across all four years" />
        <StatCard
          label="Active warnings"
          value={importantWarnings.length}
          hint={importantWarnings.length > 0 ? "See planner for details" : "All clear"}
        />
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-2 rounded-xl border border-ep-border-soft bg-white p-4 text-sm font-semibold text-ep-charcoal shadow-card transition-shadow hover:shadow-card-hover"
            >
              <ActionIcon aria-hidden className="h-5 w-5 text-ep-red" />
              {action.label}
            </Link>
          );
        })}
      </section>

      {importantWarnings.length > 0 ? (
        <section aria-label="Warnings" className="space-y-2">
          <h2 className="text-lg font-bold text-ep-charcoal">
            Needs your attention
          </h2>
          {importantWarnings.slice(0, 4).map((w) => (
            <WarningBanner key={w.id} severity={w.severity} title={w.title}>
              {w.detail}{" "}
              <Link href="/plan" className="font-semibold text-ep-red-dark underline">
                Open planner
              </Link>
            </WarningBanner>
          ))}
        </section>
      ) : null}

      {selectedPathways.length > 0 ? (
        <section aria-label="Pathway interests">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ep-charcoal">
            <Compass aria-hidden className="h-5 w-5 text-ep-red" />
            Your pathway interests
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedPathways.map((p) => (
              <Link
                key={p.id}
                href={`/pathways/${p.id}`}
                className="rounded-full border border-ep-border bg-white px-4 py-1.5 text-sm font-medium text-ep-ink shadow-card hover:border-ep-red hover:text-ep-red-dark"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {plan.length === 0 ? (
        <EmptyState
          title="No courses planned yet"
          action={
            <Link
              href="/courses"
              className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
            >
              Browse the catalog
            </Link>
          }
        >
          Start by adding courses from the catalog or asking the EPHS AI
          Assistant.
        </EmptyState>
      ) : null}

      <CounselorVerificationNotice />
    </div>
  );
}
