import { checkGradeAllowed, checkPrerequisite } from "./eligibility";
import {
  MAX_COURSES_PER_TERM,
  type CourseMeta,
  type GradeYear,
  type PlanEntry,
  type StudentProfile,
  type Term,
} from "./plan-types";

/**
 * Deterministic plan validation, re-run after every plan change.
 *
 * The guide does not publish period assignments, so we do not invent
 * period-level conflicts. We do, however, enforce the school's block model: a
 * term holds at most four course blocks (the remaining blocks are Open
 * Periods). Beyond that we validate what the source supports: grade
 * eligibility, prerequisites relative to plan order, duplicates, term
 * overflow, and class-year rules; anything else gets a counselor-verification
 * warning rather than an invented error.
 */

export type WarningSeverity = "error" | "warning" | "info";

export interface PlanWarning {
  id: string;
  severity: WarningSeverity;
  entryId?: string;
  courseId?: string;
  title: string;
  detail: string;
}

export interface PlanValidationInput {
  entries: PlanEntry[];
  profile: Pick<
    StudentProfile,
    "graduationYear" | "currentGrade" | "completedCourseIds"
  >;
  catalog: Map<string, CourseMeta>;
}

/** Sortable absolute position of an entry: grade 9 term 1 → 0 … grade 12 term 4 → 15. */
export function slotIndex(gradeYear: GradeYear, term: number): number {
  return (gradeYear - 9) * 4 + (term - 1);
}

/** A real course block counts toward term capacity; "considering" ideas do not. */
function isRealBlock(e: PlanEntry): boolean {
  return e.status !== "considering";
}

/**
 * Count the real course blocks occupying a given (grade, term). A multi-term
 * course occupies each term it spans. Open Periods are never stored as entries,
 * so they are correctly ignored here.
 */
export function countTermBlocks(
  entries: PlanEntry[],
  gradeYear: number,
  term: number,
  excludeEntryId?: string,
): number {
  let n = 0;
  for (const e of entries) {
    if (e.id === excludeEntryId) continue;
    if (e.gradeYear !== gradeYear) continue;
    if (!isRealBlock(e)) continue;
    const end = e.startTerm + e.termSpan - 1;
    if (e.startTerm <= term && term <= end) n += 1;
  }
  return n;
}

/**
 * Whether a course of `span` terms can be placed starting at (grade, startTerm)
 * without pushing any occupied term past the four-block limit. `excludeEntryId`
 * lets a move ignore the block being moved.
 */
export function canPlaceCourse(
  entries: PlanEntry[],
  gradeYear: number,
  startTerm: number,
  span: number,
  excludeEntryId?: string,
): boolean {
  for (let s = 0; s < Math.max(1, span); s++) {
    const term = startTerm + s;
    if (term > 4) return false;
    if (countTermBlocks(entries, gradeYear, term, excludeEntryId) >= MAX_COURSES_PER_TERM) {
      return false;
    }
  }
  return true;
}

/** Open Period placeholders needed to fill a term to four visible blocks. */
export function openPeriodCount(realBlocks: number): number {
  return Math.max(0, MAX_COURSES_PER_TERM - realBlocks);
}

/** Terms (grade+term) that currently have room for another course block. */
export function termsWithRoom(
  entries: PlanEntry[],
  gradeYear: number,
): Term[] {
  const out: Term[] = [];
  for (const term of [1, 2, 3, 4] as Term[]) {
    if (countTermBlocks(entries, gradeYear, term) < MAX_COURSES_PER_TERM) out.push(term);
  }
  return out;
}

export function validatePlan(input: PlanValidationInput): PlanWarning[] {
  const { entries, profile, catalog } = input;
  const warnings: PlanWarning[] = [];

  // Duplicate courses (repeatable courses are exempt).
  const seen = new Map<string, PlanEntry>();
  for (const e of entries) {
    const meta = catalog.get(e.courseId);
    if (meta?.repeatable) continue;
    const prev = seen.get(e.courseId);
    if (prev) {
      warnings.push({
        id: `dup-${e.id}`,
        severity: "warning",
        entryId: e.id,
        courseId: e.courseId,
        title: `Duplicate: ${meta?.title ?? e.courseId}`,
        detail: `This course appears more than once in your plan (grade ${prev.gradeYear} and grade ${e.gradeYear}). Unless a course is repeatable, plan it once.`,
      });
    } else {
      seen.set(e.courseId, e);
    }
  }

  // Term capacity: no term may hold more than four real course blocks.
  for (const grade of [9, 10, 11, 12] as GradeYear[]) {
    for (const term of [1, 2, 3, 4] as Term[]) {
      const n = countTermBlocks(entries, grade, term);
      if (n > MAX_COURSES_PER_TERM) {
        warnings.push({
          id: `capacity-${grade}-${term}`,
          severity: "error",
          title: `Grade ${grade}, Term ${term} is over capacity`,
          detail: `This term has ${n} course blocks, but a term holds at most ${MAX_COURSES_PER_TERM}. Move a course to a term with room or remove one.`,
        });
      }
    }
  }

  for (const e of entries) {
    const meta = catalog.get(e.courseId);
    if (!meta) {
      warnings.push({
        id: `missing-${e.id}`,
        severity: "error",
        entryId: e.id,
        courseId: e.courseId,
        title: "Unknown course",
        detail: "This plan entry references a course that is not in the active course guide.",
      });
      continue;
    }

    // Grade eligibility.
    if (!checkGradeAllowed({ grades: meta.grades }, e.gradeYear)) {
      warnings.push({
        id: `grade-${e.id}`,
        severity: "error",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: grade eligibility`,
        detail: `The guide lists this course for grade(s) ${meta.grades.join(", ")}, but it is planned for grade ${e.gradeYear}.`,
      });
    }

    // Term overflow: a multi-term course cannot run past Term 4.
    if (e.startTerm + e.termSpan - 1 > 4) {
      warnings.push({
        id: `overflow-${e.id}`,
        severity: "error",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: term placement`,
        detail: `This course occupies ${e.termSpan} consecutive term(s) and cannot start in Term ${e.startTerm} of a four-term year.`,
      });
    }

    // Unknown scheduling from the source.
    if (meta.spanRequiresVerification) {
      warnings.push({
        id: `span-${e.id}`,
        severity: "info",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: scheduling needs counselor verification`,
        detail: `The guide describes this course's length as "${meta.termLabel}". Its exact term placement must be confirmed with your counselor.`,
      });
    }

    // Prerequisites relative to the plan's order: courses completed in
    // history plus anything planned/completed strictly before this entry.
    const available = new Set(profile.completedCourseIds);
    const myStart = slotIndex(e.gradeYear, e.startTerm);
    for (const other of entries) {
      if (other.id === e.id || other.status === "considering") continue;
      const otherEnd = slotIndex(other.gradeYear, other.startTerm) + other.termSpan - 1;
      if (otherEnd < myStart) available.add(other.courseId);
    }
    const prereqResult = checkPrerequisite(meta.prereq, available);
    if (prereqResult.status === "missing_prerequisite") {
      warnings.push({
        id: `prereq-${e.id}`,
        severity: "warning",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: prerequisite not yet planned`,
        detail: `The guide lists “${meta.prereq.kind === "courses" ? meta.prereq.raw : ""}” as prerequisite, and it is not completed or planned before this course.`,
      });
    } else if (prereqResult.status === "prerequisite_unknown") {
      warnings.push({
        id: `prereq-unknown-${e.id}`,
        severity: "info",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: prerequisite needs review`,
        detail: `The guide states: “${meta.prereq.kind !== "none" ? meta.prereq.raw : ""}”. This wording could not be verified automatically - review it with your counselor.`,
      });
    } else if (prereqResult.status === "counselor_verification_required") {
      warnings.push({
        id: `prereq-manual-${e.id}`,
        severity: "info",
        entryId: e.id,
        courseId: e.courseId,
        title: `${meta.title}: counselor verification required`,
        detail: prereqResult.explanation,
      });
    }
  }

  return warnings;
}
