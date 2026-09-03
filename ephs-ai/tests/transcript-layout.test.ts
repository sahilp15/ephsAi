import { describe, expect, it } from "vitest";
import {
  parseTranscriptColumns,
  schoolYearForDate,
} from "@/lib/transcript/transcript-layout";

/**
 * Page-column text from a real Eden Prairie transcript (identity scrubbed),
 * exactly as pdf.js hands it to the parser: two columns per page, top-down.
 *
 * The shape that matters is the one that used to break the import - a block of
 * completed sophomore coursework, then an "In-Progress Courses" block that
 * carries no grade header of its own, while the student's actual grade is
 * stated only in the page header far above it.
 */
const PAGE1_LEFT = [
  "Eden Prairie High School Transcript",
  "Tel: (952)975-8000 Fax: (952)975-8020",
  "Transcript Statistics",
  "Cumulative GPA (Unweighted) 3.956",
  "Courses Taken 2024-2025 Grade 09",
  "from 064 Eden Prairie High School",
  "Course Mark Weight Credit",
  "01001E12 Honors English 9A A 1.0000 1.000",
  "01001E22 Honors English 9B A 1.0000 1.000",
  "03051E12 Honors Biology A A 1.0000 1.000",
  "05105G116 9th Grade A 0.5000 0.500",
  "Orchestra T1",
  "05105G216 9th Grade A 0.5000 0.500",
  "Orchestra T2",
  "Total Credits: 18.000",
];

const PAGE1_RIGHT = [
  "Student, Example",
  "Student Number: 00000000 Grade: 11",
  "Generated on 09/01/2026 08:50:13 AM Page 1 of 3",
  "Current Grade: 11",
  "Birthdate: 01/01/2010",
];

const PAGE2_LEFT = [
  "Courses Taken 2024-2025 Grade 10",
  "from 066 Eden Prairie Online Secondary",
  "Course Mark Weight Credit",
  "OL08051G11 Health A 1.0000 1.000",
  "Education",
  "Total Credits: 2.000",
  "In-Progress Courses",
  "Course Credit",
  "01005E11 AP English Lang & Composition 2.000",
  "10258G12 Cybersecurity A 1.000",
  "03101E12 Honors Chemistry A 1.000",
  "Credit Summary",
  "EPHS Academic Planner Earned",
  "English 4.000",
  "Math 10.000",
];

const PAGE2_RIGHT = [
  "Courses Taken 2025-2026 Grade 10",
  "from 064 Eden Prairie High School",
  "Course Mark Weight Credit",
  "01002E12 Honors English A 1.0000 1.000",
  "10A",
  "02124E12 AP AB Calculus A A- 1.0000 1.000",
  "Total Credits: 16.000",
];

const COLUMNS = [PAGE1_LEFT, PAGE1_RIGHT, PAGE2_LEFT, PAGE2_RIGHT];

describe("schoolYearForDate", () => {
  it("treats July onward as the start of a new school year", () => {
    expect(schoolYearForDate(9, 2026)).toBe("2026-2027");
    expect(schoolYearForDate(1, 2027)).toBe("2026-2027");
  });
});

describe("parseTranscriptColumns", () => {
  const { rows, meta, warnings } = parseTranscriptColumns(COLUMNS);
  const byName = (needle: string) =>
    rows.find((r) => r.rawCourseName.toLowerCase().includes(needle.toLowerCase()));

  it("reads the student's current grade and school year", () => {
    expect(meta.currentGrade).toBe(11);
    expect(meta.currentSchoolYear).toBe("2026-2027");
    expect(meta.generatedOn).toBe("09/01/2026");
  });

  it("places in-progress courses in the current grade, not the section above", () => {
    // The regression: these follow a "Grade 10" section header, so they used to
    // be imported as completed sophomore history for a junior.
    const apLang = byName("AP English Lang");
    expect(apLang?.inProgress).toBe(true);
    expect(apLang?.gradeLevel).toBe(11);
    expect(apLang?.schoolYear).toBe("2026-2027");
  });

  it("never reports a grade or earned credit for an in-progress course", () => {
    const chem = byName("Honors Chemistry");
    expect(chem?.inProgress).toBe(true);
    expect(chem?.finalGrade).toBeNull();
    expect(chem?.creditsEarned).toBeNull();
    // The credit is attempted, not banked.
    expect(chem?.creditsAttempted).toBe(1);
  });

  it("does not mistake an in-progress section letter for a letter grade", () => {
    // "10258G12 Cybersecurity A 1.000" is Cybersecurity A, not a course graded A.
    const cyber = byName("Cybersecurity");
    expect(cyber?.rawCourseName).toBe("Cybersecurity A");
    expect(cyber?.finalGrade).toBeNull();
  });

  it("keeps completed coursework on its own section's grade and year", () => {
    const english9 = byName("Honors English 9 A");
    expect(english9?.gradeLevel).toBe(9);
    expect(english9?.schoolYear).toBe("2024-2025");
    expect(english9?.finalGrade).toBe("A");
    expect(english9?.inProgress).toBe(false);

    const calc = byName("AP AB Calculus");
    expect(calc?.gradeLevel).toBe(10);
    expect(calc?.finalGrade).toBe("A-");
  });

  it("reads three-digit term-section course codes instead of dropping them", () => {
    // 05105G116 / 05105G216 are 9th Grade Orchestra T1/T2 - previously skipped
    // entirely, silently losing the Fine Arts credit they carry.
    const orchestra = rows.filter((r) => r.rawCourseName.includes("Orchestra"));
    expect(orchestra).toHaveLength(2);
    expect(orchestra.map((r) => r.term)).toEqual(["T1", "T2"]);
    expect(orchestra[0]!.rawCourseName).toBe("9th Grade Orchestra");
    expect(orchestra[0]!.gradeLevel).toBe(9);
  });

  it("does not leak a section grade onto the credit-summary tables", () => {
    const summaryLeak = rows.find((r) =>
      ["english 4.000", "math 10.000", "ephs academic planner"].includes(
        r.rawCourseName.toLowerCase(),
      ),
    );
    expect(summaryLeak).toBeUndefined();
  });

  it("never reports coursework completed above the student's current grade", () => {
    const impossible = rows.filter(
      (r) => !r.inProgress && (r.gradeLevel ?? 0) > (meta.currentGrade ?? 12),
    );
    expect(impossible).toEqual([]);
    expect(warnings).toEqual([]);
  });
});

describe("parseTranscriptColumns without a stated current grade", () => {
  const stripped = COLUMNS.map((col) =>
    col.filter((l) => !/Current Grade|Grade: 11/.test(l)),
  );
  const { rows, warnings } = parseTranscriptColumns(stripped);

  it("infers in-progress work as one year past the highest completed grade", () => {
    const apLang = rows.find((r) => r.rawCourseName.includes("AP English Lang"));
    expect(apLang?.inProgress).toBe(true);
    expect(apLang?.gradeLevel).toBe(11);
    expect(warnings.join(" ")).toMatch(/doesn't state a current grade/i);
  });
});
