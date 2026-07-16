import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";
import { getCourseById, getCourses, getPathways } from "@/lib/catalog/store";
import { toCourseMeta } from "@/lib/catalog/meta";
import { AddToPlan } from "@/components/AddToPlan";
import {
  CounselorVerificationNotice,
  CourseBadge,
  courseBadgeLabels,
  SourceCitation,
  WarningBanner,
} from "@/components/ui";

export function generateStaticParams() {
  return getCourses().map((c) => ({ courseId: c.id }));
}

export function generateMetadata({
  params,
}: {
  params: { courseId: string };
}): Metadata {
  const course = getCourseById(params.courseId);
  return { title: course ? course.title : "Course not found" };
}

export default function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = getCourseById(params.courseId);
  if (!course) notFound();

  const meta = toCourseMeta(course);
  const badges = courseBadgeLabels(course.flags, course.college_credit_available);
  const pathways = getPathways().filter(
    (p) =>
      course.pathways.includes(p.name) ||
      p.resolved_course_ids.includes(course.id),
  );
  const hasConflicts =
    course.data_quality.requires_counselor_verification ||
    course.data_quality.conflicts_detected.length > 0;

  return (
    <div className="space-y-6">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ep-muted hover:text-ep-charcoal"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-xl border border-ep-border-soft bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            {course.departments.join(" · ")}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ep-charcoal">
            {course.title}
          </h1>
          {badges.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <CourseBadge key={b} label={b} />
              ))}
            </div>
          ) : null}

          {hasConflicts ? (
            <WarningBanner severity="warning" title="Source data needs review">
              The guide contains conflicting or incomplete information for this
              course across its appearances. All source appearances are shown
              below — verify details with your counselor.
            </WarningBanner>
          ) : null}

          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ep-faint">
            Official description
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ep-ink">
            {course.description}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                Prerequisite (exact wording)
              </dt>
              <dd className="mt-1 text-sm text-ep-ink">
                {course.prerequisite_raw ?? "Not stated in the guide"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                Grades
              </dt>
              <dd className="mt-1 text-sm text-ep-ink">
                {course.grades_raw ?? "Not stated in the guide"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                Credits (exact wording)
              </dt>
              <dd className="mt-1 text-sm text-ep-ink">
                {course.credits_raw ?? "Not stated in the guide"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                Term length
              </dt>
              <dd className="mt-1 text-sm text-ep-ink">{meta.termLabel}</dd>
            </div>
            {course.college_credit_raw.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                  College credit
                </dt>
                <dd className="mt-1 text-sm text-ep-ink">
                  {course.college_credit_raw.join("; ")}
                </dd>
              </div>
            ) : null}
            {course.graduation_requirements_fulfilled_raw.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                  Graduation-requirement statements
                </dt>
                <dd className="mt-1 text-sm text-ep-ink">
                  <ul className="list-inside list-disc">
                    {course.graduation_requirements_fulfilled_raw.map((s) => (
                      <li key={s}>Fulfills {s}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            {course.notes.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                  Notes &amp; registration recommendations
                </dt>
                <dd className="mt-1 text-sm text-ep-ink">
                  <ul className="list-inside list-disc">
                    {course.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            {pathways.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-ep-faint">
                  Pathways
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2 text-sm">
                  {pathways.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pathways/${p.id}`}
                      className="rounded-full border border-ep-border bg-ep-bg px-3 py-1 text-xs font-medium text-ep-ink hover:border-ep-red hover:text-ep-red-dark"
                    >
                      {p.name}
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>

          {course.source_appearances.length > 1 ? (
            <details className="mt-6 rounded-lg border border-ep-border bg-ep-bg p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ep-ink">
                This course appears {course.source_appearances.length} times in
                the guide (cross-listed) — view all appearances
              </summary>
              <div className="mt-3 space-y-3">
                {course.source_appearances.map((a) => (
                  <div key={a.appearance_id} className="rounded-md bg-white p-3 text-sm">
                    <p className="font-semibold text-ep-charcoal">
                      {a.raw_title}{" "}
                      <span className="font-normal text-ep-muted">
                        — {a.department}, page {a.source_page}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ep-muted">
                      Prerequisite: {a.prerequisite_raw ?? "—"} · Grades:{" "}
                      {a.grades_raw ?? "—"} · Credits: {a.credits_raw ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <SourceCitation pages={course.source_pages} className="mt-6" />
        </article>

        <aside className="space-y-4">
          <AddToPlan courseId={course.id} />
          <Link
            href={`/recommend?about=${encodeURIComponent(course.title)}`}
            className="flex items-center gap-2 rounded-xl border border-ep-border-soft bg-white p-4 text-sm font-semibold text-ep-charcoal shadow-card transition-shadow hover:shadow-card-hover"
          >
            <MessageCircleQuestion aria-hidden className="h-5 w-5 text-ep-red" />
            Ask EPHS AI about this course
          </Link>
          <CounselorVerificationNotice />
        </aside>
      </div>
    </div>
  );
}
