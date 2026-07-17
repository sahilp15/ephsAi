import "server-only";
import { parsePrerequisite } from "@/lib/domain/prerequisites";
import { interpretTermSpan } from "@/lib/domain/term-span";
import type { CourseMeta } from "@/lib/domain/plan-types";
import { getCourses, resolveCourseName } from "./store";
import type { Course } from "./types";

/**
 * Compact course metadata for the deterministic engine and the client
 * planner. Built once per server process from the authoritative dataset.
 * (~269 records, a small fraction of the full dataset size - the full 2.3 MB
 * guide never ships to the browser.)
 */

let metaCache: CourseMeta[] | null = null;
let metaById: Map<string, CourseMeta> | null = null;

export function toCourseMeta(course: Course): CourseMeta {
  const span = interpretTermSpan(course.term_length_interpretation);
  return {
    id: course.id,
    title: course.title,
    department: course.primary_department,
    grades: course.grades_allowed,
    creditsRaw: course.credits_raw,
    termSpan: span.terms,
    termLabel: span.label,
    spanRequiresVerification: span.requiresVerification,
    repeatable: span.repeatable,
    prereq: parsePrerequisite(course.prerequisite_raw, { resolveCourseName }),
    flags: course.flags,
    gradStatements: course.graduation_requirements_fulfilled_raw,
    pathways: course.pathways,
    sourcePages: course.source_pages,
    collegeCredit: course.college_credit_available,
  };
}

export function getCourseMetaList(): CourseMeta[] {
  if (!metaCache) {
    metaCache = getCourses().map(toCourseMeta);
  }
  return metaCache;
}

export function getCourseMetaMap(): Map<string, CourseMeta> {
  if (!metaById) {
    metaById = new Map(getCourseMetaList().map((m) => [m.id, m]));
  }
  return metaById;
}
