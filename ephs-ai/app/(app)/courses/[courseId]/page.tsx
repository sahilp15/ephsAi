import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, GraduationCap, Sparkles, TriangleAlert } from "lucide-react";
import { getCourseById, getCourses, getPathways } from "@/lib/catalog/store";
import { toCourseMeta } from "@/lib/catalog/meta";
import { AddToPlan } from "@/components/AddToPlan";
import { AiPromptLauncher } from "@/components/chat/AiPromptLauncher";
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ep-faint">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-ep-ink">{children}</dd>
    </div>
  );
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
  const hasPrereq =
    course.prerequisite_raw && course.prerequisite_raw !== "None";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ep-muted">
        <Link href="/courses" className="hover:text-ep-charcoal">
          Courses
        </Link>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 text-ep-faint" />
        <span className="truncate text-ep-charcoal">{course.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-ep-border-soft bg-ep-card p-6 shadow-card">
          <p className="kicker">{course.departments.join(" · ")}</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ep-charcoal sm:text-4xl">
            {course.title}
          </h1>
          {badges.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <CourseBadge key={b} label={b} />
              ))}
            </div>
          ) : null}

          {hasPrereq ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-ep-warn-soft px-3 py-2 text-sm text-ep-warn">
              <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Prerequisite:</span>{" "}
                {course.prerequisite_raw}
              </span>
            </p>
          ) : null}

          {hasConflicts ? (
            <div className="mt-4">
              <WarningBanner severity="warning" title="Source data needs review">
                The guide contains conflicting or incomplete information for this
                course across its appearances. All source appearances are shown
                below — verify details with your counselor.
              </WarningBanner>
            </div>
          ) : null}

          <h2 className="mt-6 text-sm font-bold text-ep-charcoal">Overview</h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ep-ink">
            {course.description}
          </p>

          <dl className="mt-6 grid gap-5 border-t border-ep-border-soft pt-6 sm:grid-cols-2">
            <Field label="Prerequisite (exact wording)">
              {course.prerequisite_raw ?? "Not stated in the guide"}
            </Field>
            <Field label="Eligible grades">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap aria-hidden className="h-4 w-4 text-ep-faint" />
                {course.grades_raw ?? "Not stated in the guide"}
              </span>
            </Field>
            <Field label="Credits (exact wording)">
              {course.credits_raw ?? "Not stated in the guide"}
            </Field>
            <Field label="Term length">{meta.termLabel}</Field>
            {course.college_credit_raw.length > 0 ? (
              <div className="sm:col-span-2">
                <Field label="College credit">
                  {course.college_credit_raw.join("; ")}
                </Field>
              </div>
            ) : null}
            {course.graduation_requirements_fulfilled_raw.length > 0 ? (
              <div className="sm:col-span-2">
                <Field label="Graduation-requirement statements">
                  <ul className="list-inside list-disc space-y-0.5">
                    {course.graduation_requirements_fulfilled_raw.map((s) => (
                      <li key={s}>Fulfills {s}</li>
                    ))}
                  </ul>
                </Field>
              </div>
            ) : null}
            {course.notes.length > 0 ? (
              <div className="sm:col-span-2">
                <Field label="Notes & registration recommendations">
                  <ul className="list-inside list-disc space-y-0.5">
                    {course.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </Field>
              </div>
            ) : null}
            {pathways.length > 0 ? (
              <div className="sm:col-span-2">
                <Field label="Pathways">
                  <div className="mt-0.5 flex flex-wrap gap-2">
                    {pathways.map((p) => (
                      <Link
                        key={p.id}
                        href={`/pathways/${p.id}`}
                        className="rounded-full border border-ep-border bg-ep-bg px-3 py-1 text-xs font-medium text-ep-ink transition-colors hover:border-ep-red/40 hover:text-ep-red-dark"
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </Field>
              </div>
            ) : null}
          </dl>

          {course.source_appearances.length > 1 ? (
            <details className="mt-6 rounded-xl border border-ep-border bg-ep-bg p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ep-ink">
                This course appears {course.source_appearances.length} times in
                the guide (cross-listed) — view all appearances
              </summary>
              <div className="mt-3 space-y-3">
                {course.source_appearances.map((a) => (
                  <div key={a.appearance_id} className="rounded-lg bg-ep-card p-3 text-sm">
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
          <AddToPlan
            courseId={course.id}
            termSpan={meta.termSpan}
            termLabel={meta.termLabel}
            spanRequiresVerification={meta.spanRequiresVerification}
          />
          <section className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden className="h-4 w-4 text-ep-red" />
              <h2 className="text-sm font-bold text-ep-charcoal">
                Ask about this course
              </h2>
            </div>
            <AiPromptLauncher
              className="mt-3"
              placeholder={`Ask about ${course.title}…`}
              suggestions={[
                `Is ${course.title} a good fit for me?`,
                hasPrereq
                  ? "Have I met the prerequisite?"
                  : "What comes after this course?",
              ]}
            />
          </section>
          <CounselorVerificationNotice />
        </aside>
      </div>
    </div>
  );
}
