import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DEMO_STUDENTS, getDemoStudent } from "@/lib/demo/students";
import { getCourseMetaMap } from "@/lib/catalog/meta";
import { validatePlan } from "@/lib/domain/plan-validation";
import { GRADE_YEARS, TERMS } from "@/lib/domain/plan-types";
import { getEnv } from "@/lib/env";
import {
  CounselorVerificationNotice,
  WarningBanner,
} from "@/components/ui";
import { LoadDemoButton, PrintButton } from "./actions";

export function generateStaticParams() {
  return DEMO_STUDENTS.map((s) => ({ studentId: s.id }));
}

export function generateMetadata({
  params,
}: {
  params: { studentId: string };
}): Metadata {
  const s = getDemoStudent(params.studentId);
  return { title: s ? s.profile.displayName : "Student not found" };
}

export default function CounselorStudentPage({
  params,
}: {
  params: { studentId: string };
}) {
  if (!getEnv().DEMO_MODE) notFound();
  const student = getDemoStudent(params.studentId);
  if (!student) notFound();

  const catalog = getCourseMetaMap();
  const warnings = validatePlan({
    entries: student.plan,
    profile: {
      graduationYear: student.profile.graduationYear,
      currentGrade: student.profile.currentGrade,
      completedCourseIds: student.profile.completedCourseIds,
    },
    catalog,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/counselor"
        className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-ep-muted hover:text-ep-charcoal"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        All students
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
            {student.profile.displayName}
          </h1>
          <p className="mt-1 text-sm text-ep-muted">
            Grade {student.profile.currentGrade} · Class of{" "}
            {student.profile.graduationYear} · Interests:{" "}
            {student.profile.interests.join(", ")}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <PrintButton />
          <LoadDemoButton studentId={student.id} />
        </div>
      </div>

      <section aria-label="Completed courses">
        <h2 className="text-lg font-bold text-ep-charcoal">Course history</h2>
        {student.profile.completedCourseIds.length === 0 &&
        student.profile.unmatchedHistory.length === 0 ? (
          <p className="mt-1 text-sm text-ep-muted">No history recorded.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">
            {student.profile.completedCourseIds.map((id) => (
              <li key={id} className="rounded-full border border-ep-border bg-ep-card px-3 py-1 text-ep-ink">
                {catalog.get(id)?.title ?? id}
              </li>
            ))}
            {student.profile.unmatchedHistory.map((name) => (
              <li
                key={name}
                className="rounded-full border border-dashed border-ep-border bg-ep-bg px-3 py-1 text-ep-muted"
                title="Entered by the student; not matched to a catalog course"
              >
                {name} (unmatched)
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Four-year plan overview">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Plan overview (read-only)
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">
              Four-year plan by grade and term
            </caption>
            <thead>
              <tr className="border-b border-ep-border text-left text-xs uppercase tracking-wide text-ep-faint">
                <th scope="col" className="py-2 pr-3">Grade</th>
                {TERMS.map((t) => (
                  <th key={t} scope="col" className="py-2 pr-3">
                    Term {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADE_YEARS.map((g) => (
                <tr key={g} className="border-b border-ep-border-soft align-top">
                  <th scope="row" className="py-2 pr-3 font-semibold text-ep-charcoal">
                    {g}
                  </th>
                  {TERMS.map((t) => {
                    const entries = student.plan.filter((e) => {
                      const end = Math.min(4, e.startTerm + e.termSpan - 1);
                      return e.gradeYear === g && t >= e.startTerm && t <= end;
                    });
                    return (
                      <td key={t} className="py-2 pr-3">
                        {entries.map((e) => (
                          <p key={e.id} className="text-ep-ink">
                            {catalog.get(e.courseId)?.title ?? e.courseId}
                            <span className="text-xs text-ep-faint">
                              {" "}
                              ({e.status})
                            </span>
                          </p>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Validation warnings" className="space-y-2">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Validation warnings ({warnings.length})
        </h2>
        {warnings.length === 0 ? (
          <p className="text-sm text-ep-muted">No issues detected.</p>
        ) : (
          warnings.map((w) => (
            <WarningBanner key={w.id} severity={w.severity} title={w.title}>
              {w.detail}
            </WarningBanner>
          ))
        )}
      </section>

      <section aria-label="Counselor notes">
        <h2 className="text-lg font-bold text-ep-charcoal">Counselor notes</h2>
        <ul className="mt-2 space-y-2">
          {student.counselorNotes.map((n) => (
            <li key={n} className="rounded-lg border border-ep-border-soft bg-ep-card p-3 text-sm text-ep-ink shadow-card">
              {n}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ep-faint">
          In production, counselors can add notes here (stored with row-level
          security; visible to the student).
        </p>
      </section>

      <section aria-label="Recommendation history">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Example AI questions from this student
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-ep-ink">
          {student.exampleQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
