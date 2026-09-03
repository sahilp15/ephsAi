import { describe, expect, it } from "vitest";
import {
  historyToPlanEntries,
  parseTerm,
  projectHistory,
  type AcademicRecordInput,
} from "@/lib/domain/academic-history";

const records: AcademicRecordInput[] = [
  { id: "r1", courseId: "english-9-a-and-b", recordType: "completed", gradeLevel: 9, term: "S1", creditsEarned: 0.5 },
  { id: "r2", courseId: "algebra-ii", recordType: "completed", gradeLevel: 9, term: "S1", creditsEarned: 0.5 },
  { id: "r3", courseId: "ap-us-history", recordType: "in_progress", gradeLevel: 10, term: "S1", creditsEarned: 0.5 },
  { id: "r4", courseId: null, originalCourseName: "Spanish 2", recordType: "transfer", gradeLevel: 9, term: "S2", creditsEarned: 0.5 },
  { id: "r5", courseId: null, originalCourseName: "Mystery", recordType: "unmatched", gradeLevel: 9 },
];

describe("parseTerm", () => {
  it("maps EPHS terms and semesters onto the four-term year", () => {
    expect(parseTerm("T3")).toEqual({ startTerm: 3, span: 1 });
    expect(parseTerm("S1")).toEqual({ startTerm: 1, span: 2 });
    expect(parseTerm("S2")).toEqual({ startTerm: 3, span: 2 });
    expect(parseTerm("Full Year")).toEqual({ startTerm: 1, span: 4 });
  });
});

describe("projectHistory", () => {
  const p = projectHistory(records);

  it("collects completed + in-progress + matched transfer as prerequisite-satisfying ids", () => {
    expect(p.completedCourseIds).toContain("english-9-a-and-b");
    expect(p.completedCourseIds).toContain("algebra-ii");
    // in-progress counts toward prerequisites for the next term
    expect(p.completedCourseIds).toContain("ap-us-history");
  });

  it("tallies earned vs in-progress credits separately", () => {
    // r1 + r2 completed + r4 transfer = 1.5 earned; r3 in-progress = 0.5
    expect(p.creditsEarned).toBeCloseTo(1.5);
    expect(p.creditsInProgress).toBeCloseTo(0.5);
  });

  it("counts unmatched courses without inventing a match", () => {
    expect(p.unmatchedCount).toBe(1);
  });
});

describe("historyToPlanEntries", () => {
  it("places matched completed/in-progress courses into grade + term slots", () => {
    const entries = historyToPlanEntries(records);
    const english = entries.find((e) => e.courseId === "english-9-a-and-b");
    expect(english).toBeTruthy();
    expect(english?.gradeYear).toBe(9);
    expect(english?.startTerm).toBe(1);
    expect(english?.status).toBe("completed");
    // Unmatched and transfer-without-match courses take no planner slot.
    expect(entries.every((e) => e.courseId)).toBe(true);
  });

  it("distributes unlabeled courses across terms instead of stacking them in Term 1", () => {
    const noTerm: AcademicRecordInput[] = Array.from({ length: 8 }, (_, i) => ({
      id: `n${i}`,
      courseId: `course-${i}`,
      recordType: "completed" as const,
      gradeLevel: 9,
      term: null,
    }));
    const entries = historyToPlanEntries(noTerm);
    const perTerm = [1, 2, 3, 4].map(
      (t) => entries.filter((e) => e.startTerm === t).length,
    );
    // 8 courses, no term info → 2 per term, none exceeding four.
    expect(perTerm).toEqual([2, 2, 2, 2]);
    expect(Math.max(...perTerm)).toBeLessThanOrEqual(4);
  });

  it("respects explicit term codes (T1-T4) exactly", () => {
    const explicit: AcademicRecordInput[] = [
      { id: "a", courseId: "c-a", recordType: "completed", gradeLevel: 10, term: "T4" },
      { id: "b", courseId: "c-b", recordType: "completed", gradeLevel: 10, term: "T2" },
    ];
    const entries = historyToPlanEntries(explicit);
    expect(entries.find((e) => e.courseId === "c-a")?.startTerm).toBe(4);
    expect(entries.find((e) => e.courseId === "c-b")?.startTerm).toBe(2);
  });

  it("collapses duplicate course entries within a grade", () => {
    const dupes: AcademicRecordInput[] = [
      { id: "d1", courseId: "dup", recordType: "completed", gradeLevel: 11, term: "T1" },
      { id: "d2", courseId: "dup", recordType: "completed", gradeLevel: 11, term: "T1" },
    ];
    const entries = historyToPlanEntries(dupes);
    expect(entries.filter((e) => e.courseId === "dup")).toHaveLength(1);
  });

  it("marks in-progress coursework as in progress, not completed", () => {
    const entries = historyToPlanEntries(records);
    const apush = entries.find((e) => e.courseId === "ap-us-history");
    expect(apush?.status).toBe("in_progress");
  });

  it("places an ungraded in-progress course in the student's current grade", () => {
    // A junior's current courses carry no grade level of their own. Without the
    // current grade they used to default to 9, dropping a junior's schedule into
    // freshman year.
    const current: AcademicRecordInput[] = [
      { id: "ip1", courseId: "ap-lang", recordType: "in_progress", gradeLevel: null, term: null },
    ];
    expect(historyToPlanEntries(current, { currentGrade: 11 })[0]?.gradeYear).toBe(11);
  });

  it("still defaults completed courses with no grade level to grade 9", () => {
    const unknown: AcademicRecordInput[] = [
      { id: "c1", courseId: "mystery", recordType: "completed", gradeLevel: null, term: null },
    ];
    expect(historyToPlanEntries(unknown, { currentGrade: 11 })[0]?.gradeYear).toBe(9);
  });

  it("reports a genuinely overloaded year as taken rather than relocating history", () => {
    // Six real courses in one term is a validation warning for the student to
    // resolve - not something to silently reshuffle after the fact.
    const overloaded: AcademicRecordInput[] = Array.from({ length: 6 }, (_, i) => ({
      id: `o${i}`,
      courseId: `over-${i}`,
      recordType: "completed" as const,
      gradeLevel: 10,
      term: "T1",
    }));
    const entries = historyToPlanEntries(overloaded);
    expect(entries).toHaveLength(6);
    expect(entries.every((e) => e.startTerm === 1)).toBe(true);
  });
});
