"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStudent } from "@/lib/client/student-context";
import { computePathwayAlignment } from "@/lib/domain/pathways";

/** Shows which of the student's history/plan courses align with a pathway. */
export function PathwayAlignmentPanel({
  pathwayId,
  pathwayName,
  resolvedCourseIds,
}: {
  pathwayId: string;
  pathwayName: string;
  resolvedCourseIds: string[];
}) {
  const { profile, plan, catalogMeta, metaReady } = useStudent();

  const alignment = useMemo(() => {
    if (!metaReady) return null;
    const studentCourseIds = [
      ...profile.completedCourseIds,
      ...plan.map((e) => e.courseId),
    ];
    return computePathwayAlignment(
      { id: pathwayId, name: pathwayName, resolved_course_ids: resolvedCourseIds },
      studentCourseIds,
      catalogMeta,
    );
  }, [metaReady, profile.completedCourseIds, plan, pathwayId, pathwayName, resolvedCourseIds, catalogMeta]);

  return (
    <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
      <h2 className="text-sm font-bold text-ep-charcoal">
        Your alignment with this pathway
      </h2>
      {!alignment ? (
        <p role="status" className="mt-2 text-sm text-ep-muted">
          Loading…
        </p>
      ) : alignment.alignedCourseIds.length === 0 ? (
        <p className="mt-2 text-sm text-ep-muted">
          None of your completed or planned courses are listed under this
          pathway yet.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-ep-muted">
            {alignment.alignedCourseIds.length} of your completed or planned
            course{alignment.alignedCourseIds.length === 1 ? " is" : "s are"}{" "}
            aligned with this pathway:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-ep-ink">
            {alignment.alignedCourseIds.map((id) => (
              <li key={id}>
                <Link href={`/courses/${id}`} className="font-medium text-ep-red-dark hover:underline">
                  {catalogMeta.get(id)?.title ?? id}
                </Link>
                {alignment.alignedCapstoneIds.includes(id) ? " (capstone)" : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
