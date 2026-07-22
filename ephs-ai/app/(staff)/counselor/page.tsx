import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { DEMO_STUDENTS } from "@/lib/demo/students";
import { getEnv } from "@/lib/env";
import { EmptyState, WarningBanner } from "@/components/ui";

export const metadata: Metadata = { title: "Counselor View" };

export default function CounselorPage() {
  const demoMode = getEnv().DEMO_MODE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
          <Users aria-hidden className="h-8 w-8 text-ep-red" />
          Counselor View
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ep-muted">
          Read-only review of student plans, validation warnings, and
          recommendation history. In production this view is protected by
          counselor sign-in and row-level security; in demo mode it shows three
          fictional students.
        </p>
      </div>

      {!demoMode ? (
        <EmptyState title="Demo mode is disabled">
          Counselor access requires sign-in in production. Set DEMO_MODE=true
          to explore with fictional students.
        </EmptyState>
      ) : (
        <>
          <WarningBanner severity="info" title="Demo mode">
            All students below are fictional. No real student data exists in
            this deployment.
          </WarningBanner>
          <ul className="grid gap-4 md:grid-cols-3">
            {DEMO_STUDENTS.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/counselor/students/${s.id}`}
                  className="group block h-full rounded-xl border border-ep-border-soft bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <h2 className="font-bold text-ep-charcoal group-hover:text-ep-red-dark">
                    {s.profile.displayName}
                  </h2>
                  <p className="mt-1 text-sm text-ep-muted">
                    Grade {s.profile.currentGrade} · Class of{" "}
                    {s.profile.graduationYear}
                  </p>
                  <p className="mt-2 text-xs text-ep-faint">
                    {s.profile.interests.slice(0, 3).join(" · ")}
                  </p>
                  <p className="mt-3 text-xs font-medium text-ep-muted">
                    {s.plan.length} plan entries ·{" "}
                    {s.profile.completedCourseIds.length} completed courses
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
