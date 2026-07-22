import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles, TriangleAlert } from "lucide-react";
import type { Course } from "@/lib/catalog/types";
import { CourseBadge, courseBadgeLabels, SourceCitation } from "./ui";

export function CourseCard({ course }: { course: Course }) {
  const badges = courseBadgeLabels(course.flags, course.college_credit_available);
  const hasPrereq =
    course.prerequisite_raw && course.prerequisite_raw !== "None";

  return (
    <article className="group flex h-full flex-col rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card transition-all duration-micro ease-ep-out hover:-translate-y-0.5 hover:border-ep-border hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug text-ep-charcoal">
          <Link
            href={`/courses/${course.id}`}
            className="rounded hover:text-ep-red-dark"
          >
            {course.title}
          </Link>
        </h3>
      </div>
      <p className="mt-1 text-xs font-medium text-ep-muted">
        {course.departments.join(" · ")}
      </p>

      {badges.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {badges.map((b) => (
            <CourseBadge key={b} label={b} />
          ))}
        </div>
      ) : null}

      <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-ep-ink">
        {course.description}
      </p>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ep-muted">
        <div className="flex items-center gap-1">
          <GraduationCap aria-hidden className="h-3.5 w-3.5 text-ep-faint" />
          <dt className="sr-only">Grades</dt>
          <dd>{course.grades_raw ?? "See guide"}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Credits: </dt>
          <dd className="inline">{course.credits_raw ?? "See guide"}</dd>
        </div>
      </dl>

      {hasPrereq ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-ep-warn-soft px-2.5 py-1.5 text-xs leading-snug text-ep-warn">
          <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Prerequisite:</span>{" "}
            {course.prerequisite_raw}
          </span>
        </p>
      ) : null}

      {course.pathways.length > 0 ? (
        <p className="mt-2 text-xs text-ep-muted">
          <span className="font-medium">Pathways:</span>{" "}
          {course.pathways.join(", ")}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ep-border-soft pt-3">
        <SourceCitation pages={course.source_pages} />
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/chat?about=${encodeURIComponent(course.title)}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ep-muted transition-colors hover:bg-ep-bg-sunken hover:text-ep-red-dark"
            title={`Ask EPHS AI about ${course.title}`}
          >
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            Ask AI
          </Link>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ep-red-dark transition-colors hover:bg-ep-red-soft"
          >
            Details
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
