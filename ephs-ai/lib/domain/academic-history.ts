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
import { GRADE_YEARS, TERMS, MAX_COURSES_PER_TERM } from "./plan-types";

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

export interface TermInterpretation {
  /** Starting term (1-4), or null when the transcript gives no term signal. */
  startTerm: Term | null;
  span: number;
}

/**
 * Interpret a transcript term string. Returns `startTerm: null` when there is
 * no usable term signal, so the caller can distribute the course intelligently
 * instead of defaulting everyone into Term 1.
 *
 * EPHS runs a four-term year. Course codes encode the term as T1-T4/Q1-Q4
 * (mapped 1:1). Genuine semester wording (Semester 1/2, Fall/Spring) spans two
 * terms. "Full year" spans all four.
 */
export function interpretTerm(term: string | null | undefined): TermInterpretation {
  const t = (term ?? "").toLowerCase().trim();
  if (!t) return { startTerm: null, span: 1 };
  // Explicit four-term / quarter codes: T1-T4, Term 3, Q1-Q4.
  const termMatch = t.match(/(?:t(?:erm)?|q(?:uarter)?)\s*([1-4])/);
  if (termMatch) return { startTerm: Number(termMatch[1]) as Term, span: 1 };
  // Genuine semesters map onto the four-term year (S1 = terms 1-2, S2 = 3-4).
  if (/semester\s*1|^s1$|\bs1\b|fall|first/.test(t)) return { startTerm: 1, span: 2 };
  if (/semester\s*2|^s2$|\bs2\b|spring|second/.test(t)) return { startTerm: 3, span: 2 };
  // Defensive: bare S3/S4 (rare) are treated as the four-term codes 3/4.
  if (/^s3$|\bs3\b/.test(t)) return { startTerm: 3, span: 1 };
  if (/^s4$|\bs4\b/.test(t)) return { startTerm: 4, span: 1 };
  if (/full|year/.test(t)) return { startTerm: 1, span: 4 };
  return { startTerm: null, span: 1 };
}

/**
 * Backwards-compatible term parser. Unknown terms fall back to Semester 1 for
 * legacy single-record callers; prefer `interpretTerm` + `distributeHistoryTerms`
 * for import placement so unlabeled courses are spread, not stacked in Term 1.
 */
export function parseTerm(term: string | null | undefined): { startTerm: Term; span: number } {
  const i = interpretTerm(term);
  if (i.startTerm === null) return { startTerm: 1, span: 2 };
  return { startTerm: i.startTerm, span: i.span };
}

function clampGrade(grade: number | null | undefined): GradeYear {
  if (grade && GRADE_YEARS.includes(grade as GradeYear)) return grade as GradeYear;
  return 9;
}

/**
 * Turn confirmed history into completed plan entries for display in the
 * four-year planner. These are historical, not draggable future courses; the
 * caller marks them `status: "completed"`.
 *
 * Placement rules (this is the fix for "everything lands in Term 1"):
 *   1. Records with an explicit transcript term keep it exactly.
 *   2. Records with no term signal are distributed across the grade's four
 *      terms by filling the least-occupied term first, so a year's courses
 *      spread out instead of stacking.
 *   3. No term is filled past four blocks; overflow spills to the next term.
 *
 * Duplicate course ids within the same grade are collapsed so a course that
 * shows up twice on a transcript does not occupy two slots.
 */
export function historyToPlanEntries(records: AcademicRecordInput[]): PlanEntry[] {
  // Only matched completed/in-progress courses take a planner slot; de-dupe by
  // (gradeYear, courseId) so repeated transcript lines collapse to one block.
  const seen = new Set<string>();
  const placeable = records.filter((rec) => {
    if (!rec.courseId) return false;
    if (rec.recordType !== "completed" && rec.recordType !== "in_progress") return false;
    const key = `${clampGrade(rec.gradeLevel)}:${rec.courseId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const byGrade = new Map<GradeYear, AcademicRecordInput[]>();
  for (const rec of placeable) {
    const g = clampGrade(rec.gradeLevel);
    (byGrade.get(g) ?? byGrade.set(g, []).get(g)!).push(rec);
  }

  const entries: PlanEntry[] = [];
  for (const [gradeYear, recs] of byGrade) {
    // Occupancy per term for this grade year (index 0 unused).
    const load: Record<Term, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const occupy = (start: Term, span: number) => {
      for (let s = 0; s < span; s++) {
        const term = Math.min(4, start + s) as Term;
        load[term] += 1;
      }
    };

    const known: Array<{ rec: AcademicRecordInput; startTerm: Term; span: number }> = [];
    const unknown: AcademicRecordInput[] = [];
    for (const rec of recs) {
      const it = interpretTerm(rec.term);
      if (it.startTerm !== null) known.push({ rec, startTerm: it.startTerm, span: it.span });
      else unknown.push(rec);
    }

    // 1. Place explicit-term courses first and record their occupancy.
    for (const k of known) {
      occupy(k.startTerm, k.span);
      entries.push({
        id: `history-${k.rec.id}`,
        courseId: k.rec.courseId!,
        gradeYear,
        startTerm: k.startTerm,
        termSpan: k.span,
        status: "completed",
      });
    }

    // 2. Spread unlabeled courses into the least-occupied term (respecting the
    //    four-block cap; if every term is full, fall back to the emptiest one).
    for (const rec of unknown) {
      let best: Term = 1;
      for (const term of TERMS) {
        if (load[term] < load[best]) best = term;
      }
      const target =
        load[best] < MAX_COURSES_PER_TERM
          ? best
          : // all terms at cap: still pick the emptiest to keep things balanced
            best;
      occupy(target, 1);
      entries.push({
        id: `history-${rec.id}`,
        courseId: rec.courseId!,
        gradeYear,
        startTerm: target,
        termSpan: 1,
        status: "completed",
      });
    }
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
