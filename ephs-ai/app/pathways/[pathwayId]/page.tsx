import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCourseById,
  getPathwayById,
  getPathways,
  resolveCourseName,
} from "@/lib/catalog/store";
import { SourceCitation, WarningBanner } from "@/components/ui";
import { PathwayAlignmentPanel } from "./PathwayAlignmentPanel";

export function generateStaticParams() {
  return getPathways().map((p) => ({ pathwayId: p.id }));
}

export function generateMetadata({
  params,
}: {
  params: { pathwayId: string };
}): Metadata {
  const p = getPathwayById(params.pathwayId);
  return { title: p ? p.name : "Pathway not found" };
}

function CourseRefList({
  refs,
  emptyLabel,
}: {
  refs: Array<{ name: string; raw_entry: string; markers_raw: string[] }>;
  emptyLabel: string;
}) {
  if (refs.length === 0) {
    return <p className="text-sm text-ep-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="mt-2 space-y-1.5">
      {refs.map((ref) => {
        const resolvedId = resolveCourseName(ref.name);
        const course = resolvedId ? getCourseById(resolvedId) : undefined;
        return (
          <li
            key={ref.raw_entry}
            className="flex items-baseline justify-between gap-2 rounded-lg border border-ep-border-soft bg-white px-3 py-2 text-sm"
          >
            {course ? (
              <Link
                href={`/courses/${course.id}`}
                className="font-medium text-ep-charcoal hover:text-ep-red-dark"
              >
                {course.title}
              </Link>
            ) : (
              <span className="text-ep-ink">
                {ref.name}
                <span className="ml-1.5 text-xs text-ep-faint">
                  (listed in the guide; not a separate catalog entry)
                </span>
              </span>
            )}
            {ref.markers_raw.length > 0 ? (
              <span
                className="shrink-0 text-xs text-ep-faint"
                title="Raw marker preserved from the guide (meaning not defined on the extracted pages)"
              >
                {ref.markers_raw.join(" ")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function PathwayDetailPage({
  params,
}: {
  params: { pathwayId: string };
}) {
  const pathway = getPathwayById(params.pathwayId);
  if (!pathway) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/pathways"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ep-muted hover:text-ep-charcoal"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        All pathways
      </Link>

      <div>
        <h1 className="text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">{pathway.name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ep-ink">
          {pathway.description}
        </p>
        <SourceCitation pages={pathway.source_pages} className="mt-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section aria-label="Capstone courses">
            <h2 className="text-lg font-bold text-ep-charcoal">
              Capstone courses
            </h2>
            <CourseRefList
              refs={pathway.capstones}
              emptyLabel="No capstones listed for this pathway."
            />
          </section>

          <section aria-label="Supporting courses">
            <h2 className="text-lg font-bold text-ep-charcoal">
              Supporting courses
            </h2>
            <CourseRefList
              refs={pathway.supporting_courses}
              emptyLabel="No supporting courses listed."
            />
            <p className="mt-2 text-xs text-ep-faint">
              Symbols such as *, **, •, TC, and @ are shown exactly as printed
              in the guide. Their full meanings are not defined on the
              extracted pathway pages - ask your counselor when in doubt.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <PathwayAlignmentPanel
            pathwayId={pathway.id}
            pathwayName={pathway.name}
            resolvedCourseIds={pathway.resolved_course_ids}
          />
          <WarningBanner severity="info" title="About pathway progress">
            The guide does not define official pathway-completion criteria, so
            this tool shows courses aligned with the pathway - never a
            completion percentage.
          </WarningBanner>
        </aside>
      </div>
    </div>
  );
}
