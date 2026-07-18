import { describe, expect, it } from "vitest";
import { parseTranscriptText } from "@/lib/transcript/parse";

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
