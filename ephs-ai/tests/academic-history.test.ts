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
});
