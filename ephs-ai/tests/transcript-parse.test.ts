import { describe, expect, it } from "vitest";
import { parseTranscriptText, parseTranscriptDocument } from "@/lib/transcript/parse";

const SAMPLE = `
Eden Prairie High School - Official Transcript
Student: Jane Doe    ID: 123456

2023-2024   Grade 9
English 9              A     0.5 cr   S1
Algebra II             B+    0.5 cr   S1
Honors Biology         A-    1.0 cr   Full Year
World Geography        A     0.5 cr   S2

2024-2025   Grade 10
AP US History          IP    in progress
Spanish 2 (transfer)   A     0.5 cr
Cumulative GPA: 3.8
`;

describe("parseTranscriptText", () => {
  const rows = parseTranscriptText(SAMPLE);

  it("extracts course rows and skips headers/footers", () => {
    const names = rows.map((r) => r.rawCourseName.toLowerCase());
    expect(names.some((n) => n.includes("english 9"))).toBe(true);
    expect(names.some((n) => n.includes("algebra"))).toBe(true);
    expect(names.some((n) => n.includes("biology"))).toBe(true);
    expect(names.some((n) => n.includes("gpa"))).toBe(false);
    expect(names.some((n) => n.includes("student"))).toBe(false);
  });

  it("captures school year and grade level from section headers", () => {
    const english = rows.find((r) => r.rawCourseName.toLowerCase().includes("english"));
    expect(english?.schoolYear).toBe("2023-2024");
    expect(english?.gradeLevel).toBe(9);
  });

  it("captures final grade and credits", () => {
    const algebra = rows.find((r) => r.rawCourseName.toLowerCase().includes("algebra"));
    expect(algebra?.finalGrade).toBe("B+");
    expect(algebra?.creditsEarned).toBe(0.5);
  });

  it("flags in-progress and transfer courses", () => {
    const apush = rows.find((r) => r.rawCourseName.toLowerCase().includes("history"));
    expect(apush?.inProgress).toBe(true);
    const spanish = rows.find((r) => r.rawCourseName.toLowerCase().includes("spanish"));
    expect(spanish?.isTransfer).toBe(true);
  });
});

/**
 * The plain-text fallback has to understand the same document structure the
 * PDF reader does: zero-padded section grades, a current-grade statement, and
 * an in-progress block that belongs to the year the student is starting.
 */
const PADDED = `
Courses Taken 2024-2025 Grade 09
Honors English 9A     A    1.0 cr
Current Grade: 11
In-Progress Courses
AP Statistics    2.0 cr
Credit Summary
Math   10.0 cr
`;

describe("parseTranscriptDocument", () => {
  const { rows, meta } = parseTranscriptDocument(PADDED);

  it("reads zero-padded section grade levels", () => {
    const english = rows.find((r) => r.rawCourseName.toLowerCase().includes("english"));
    expect(english?.gradeLevel).toBe(9);
  });

  it("reads the student's current grade without treating it as a section", () => {
    expect(meta.currentGrade).toBe(11);
  });

  it("assigns in-progress courses to the current grade with no earned credit", () => {
    const stats = rows.find((r) => r.rawCourseName.toLowerCase().includes("statistics"));
    expect(stats?.inProgress).toBe(true);
    expect(stats?.gradeLevel).toBe(11);
    expect(stats?.finalGrade).toBeNull();
    expect(stats?.creditsEarned).toBeNull();
  });

  it("stops a section grade from leaking into the credit summary", () => {
    const mathSummary = rows.find((r) => r.rawCourseName.toLowerCase() === "math");
    expect(mathSummary).toBeUndefined();
  });
});
