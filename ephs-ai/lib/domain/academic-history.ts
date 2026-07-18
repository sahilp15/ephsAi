/**
 * Projects confirmed academic records into the shape the existing planner and
 * graduation engine already consume. Pure and deterministic.
 *
 * The planner (`plan-validation.ts`), eligibility (`eligibility.ts`) and
 * graduation report (`graduation-rules.ts`) all key off completed course ids
 * and plan entries. This module turns stored `academic_records` into exactly
 * those inputs, so confirmed transcript history flows into every downstream
 * calculation without changing the engine.
 */

import type { GradeYear, PlanEntry, Term } from "./plan-types";
import { GRADE_YEARS } from "./plan-types";

export type AcademicRecordType =
  | "completed"
  | "in_progress"
  | "transfer"
  | "manual"
  | "repeat_needed"
  | "unmatched";

export interface AcademicRecordInput {
  id: string;
  courseId: string | null;
  originalCourseName?: string | null;
  recordType: AcademicRecordType;
  gradeLevel?: number | null;
  term?: string | null;
  creditsEarned?: number | null;
  isTransfer?: boolean;
}

export interface HistoryProjection {
  /** Course ids that count as satisfying prerequisites (completed/in-progress/transfer-with-match). */
  completedCourseIds: string[];
  inProgressCourseIds: string[];
  transferCourseIds: string[];
  creditsEarned: number;
  creditsInProgress: number;
  unmatchedCount: number;
  repeatNeededCourseIds: string[];
}

/** Map a transcript term string to a starting term (1-4) and span. */
export function parseTerm(term: string | null | undefined): { startTerm: Term; span: number } {
  const t = (term ?? "").toLowerCase().trim();
  // Explicit EPHS terms T1-T4.
  const termMatch = t.match(/t(?:erm)?\s*([1-4])/);
  if (termMatch) {
    const n = Number(termMatch[1]) as Term;
    return { startTerm: n, span: 1 };
  }
  // Semesters map onto the four-term year (S1 = terms 1-2, S2 = terms 3-4).
  if (/s(?:emester)?\s*1|fall|first/.test(t)) return { startTerm: 1, span: 2 };
  if (/s(?:emester)?\s*2|spring|second/.test(t)) return { startTerm: 3, span: 2 };
  if (/full|year/.test(t)) return { startTerm: 1, span: 4 };
  return { startTerm: 1, span: 2 };
}

function clampGrade(grade: number | null | undefined): GradeYear {
  if (grade && GRADE_YEARS.includes(grade as GradeYear)) return grade as GradeYear;
  return 9;
}

/**
 * Turn confirmed history into completed plan entries for display in the
 * four-year planner. These are historical, not draggable future courses; the
 * caller marks them `status: "completed"`.
 */
export function historyToPlanEntries(records: AcademicRecordInput[]): PlanEntry[] {
  const entries: PlanEntry[] = [];
  for (const rec of records) {
    if (!rec.courseId) continue; // only matched courses take a planner slot
    if (rec.recordType !== "completed" && rec.recordType !== "in_progress") continue;
    const { startTerm, span } = parseTerm(rec.term);
    entries.push({
      id: `history-${rec.id}`,
      courseId: rec.courseId,
      gradeYear: clampGrade(rec.gradeLevel),
      startTerm,
      termSpan: span,
      status: "completed",
    });
  }
  return entries;
}

/** Aggregate confirmed history into the completed-ids + credit tallies the engine needs. */
export function projectHistory(records: AcademicRecordInput[]): HistoryProjection {
  const completed = new Set<string>();
  const inProgress = new Set<string>();
  const transfer = new Set<string>();
  const repeatNeeded = new Set<string>();
  let creditsEarned = 0;
  let creditsInProgress = 0;
  let unmatchedCount = 0;

  for (const rec of records) {
    const credits = typeof rec.creditsEarned === "number" ? rec.creditsEarned : 0;
    switch (rec.recordType) {
      case "completed":
        if (rec.courseId) completed.add(rec.courseId);
        else unmatchedCount += 1;
        creditsEarned += credits;
        break;
      case "in_progress":
        if (rec.courseId) {
          inProgress.add(rec.courseId);
          // In-progress courses satisfy prerequisites for the *next* term.
          completed.add(rec.courseId);
        }
        creditsInProgress += credits;
        break;
      case "transfer":
        if (rec.courseId) {
          transfer.add(rec.courseId);
          completed.add(rec.courseId);
        } else {
          transfer.add(rec.originalCourseName ?? rec.id);
        }
        creditsEarned += credits;
        break;
      case "repeat_needed":
        if (rec.courseId) repeatNeeded.add(rec.courseId);
        break;
      case "unmatched":
        unmatchedCount += 1;
        break;
      default:
        break;
    }
  }

  return {
    completedCourseIds: [...completed],
    inProgressCourseIds: [...inProgress],
    transferCourseIds: [...transfer],
    creditsEarned,
    creditsInProgress,
    unmatchedCount,
    repeatNeededCourseIds: [...repeatNeeded],
  };
}
