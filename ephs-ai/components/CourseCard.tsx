import Link from "next/link";
import type { Course } from "@/lib/catalog/types";
import { CourseBadge, courseBadgeLabels, SourceCitation } from "./ui";

export function CourseCard({ course }: { course: Course }) {
  const badges = courseBadgeLabels(course.flags, course.college_credit_available);
  return (
    <article className="flex h-full flex-col rounded-xl border border-ep-border-soft bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold leading-snug text-ep-charcoal">
          <Link
            href={`/courses/${course.id}`}
            className="hover:text-ep-red-dark"
          >
            {course.title}
          </Link>
        </h3>
      </div>
      <p className="mt-0.5 text-xs font-medium text-ep-muted">
        {course.departments.join(" · ")}
      </p>
      {badges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.map((b) => (
            <CourseBadge key={b} label={b} />
          ))}
        </div>
      ) : null}
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-ep-ink">
        {course.description}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ep-muted">
        <div>
          <dt className="inline font-semibold">Grades: </dt>
          <dd className="inline">{course.grades_raw ?? "See guide"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Credits: </dt>
          <dd className="inline">{course.credits_raw ?? "See guide"}</dd>
        </div>
        {course.prerequisite_raw && course.prerequisite_raw !== "None" ? (
          <div className="col-span-2">
            <dt className="inline font-semibold">Prerequisite: </dt>
            <dd className="inline">{course.prerequisite_raw}</dd>
          </div>
        ) : null}
        {course.pathways.length > 0 ? (
          <div className="col-span-2">
            <dt className="inline font-semibold">Pathways: </dt>
            <dd className="inline">{course.pathways.join(", ")}</dd>
          </div>
        ) : null}
      </dl>
      <SourceCitation pages={course.source_pages} className="mt-3" />
    </article>
  );
}
