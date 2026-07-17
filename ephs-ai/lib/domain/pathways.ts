import type { CourseMeta } from "./plan-types";

/**
 * Pathway alignment. The guide defines five official pathways with capstones
 * and supporting courses. It does NOT define completion criteria, so we only
 * ever report "courses aligned with this pathway" - never a completion
 * percentage or a claim that a pathway is finished.
 */

export interface PathwayAlignment {
  pathwayId: string;
  pathwayName: string;
  /** Student's history/plan course ids that belong to this pathway. */
  alignedCourseIds: string[];
  /** Capstone-flagged aligned courses. */
  alignedCapstoneIds: string[];
}

export function computePathwayAlignment(
  pathway: { id: string; name: string; resolved_course_ids: string[] },
  studentCourseIds: readonly string[],
  catalog: Map<string, CourseMeta>,
): PathwayAlignment {
  const memberIds = new Set(pathway.resolved_course_ids);
  // Courses also self-declare pathway membership in the guide.
  for (const [id, meta] of catalog) {
    if (meta.pathways.includes(pathway.name)) memberIds.add(id);
  }
  const aligned = studentCourseIds.filter((id) => memberIds.has(id));
  const capstones = aligned.filter((id) => catalog.get(id)?.flags.capstone);
  return {
    pathwayId: pathway.id,
    pathwayName: pathway.name,
    alignedCourseIds: Array.from(new Set(aligned)),
    alignedCapstoneIds: Array.from(new Set(capstones)),
  };
}
