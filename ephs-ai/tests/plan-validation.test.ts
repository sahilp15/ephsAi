import { describe, expect, it } from "vitest";
import { validatePlan } from "@/lib/domain/plan-validation";
import type { PlanEntry } from "@/lib/domain/plan-types";
import { makeCourse } from "./helpers";

const catalog = new Map(
  [
    makeCourse({ id: "art-1" }),
    makeCourse({ id: "seniors-only", grades: [12] }),
    makeCourse({ id: "two-term", termSpan: 2 }),
    makeCourse({
      id: "advanced",
      prereq: { kind: "courses", raw: "art-1", groups: [["art-1"]] },
    }),
    makeCourse({ id: "repeatable", repeatable: true }),
  ].map((c) => [c.id, c]),
);

const profile = {
  graduationYear: 2029,
  currentGrade: 9 as const,
  completedCourseIds: [] as string[],
};

let nextId = 0;
function entry(overrides: Partial<PlanEntry> & { courseId: string }): PlanEntry {
  return {
    id: `t-${nextId++}`,
    gradeYear: 9,
    startTerm: 1,
    termSpan: 1,
    status: "planned",
    ...overrides,
  };
}

describe("validatePlan", () => {
  it("passes a clean plan", () => {
    const warnings = validatePlan({
      entries: [entry({ courseId: "art-1" })],
      profile,
      catalog,
    });
    expect(warnings).toEqual([]);
  });

  it("flags grade-ineligible placement as an error", () => {
    const warnings = validatePlan({
      entries: [entry({ courseId: "seniors-only", gradeYear: 9 })],
      profile,
      catalog,
    });
    expect(warnings.some((w) => w.id.startsWith("grade-") && w.severity === "error")).toBe(true);
  });

  it("flags duplicate courses", () => {
    const warnings = validatePlan({
      entries: [
        entry({ courseId: "art-1", gradeYear: 9 }),
        entry({ courseId: "art-1", gradeYear: 10 }),
      ],
      profile,
      catalog,
    });
    expect(warnings.some((w) => w.id.startsWith("dup-"))).toBe(true);
  });

  it("does not flag repeatable courses as duplicates", () => {
    const warnings = validatePlan({
      entries: [
        entry({ courseId: "repeatable", gradeYear: 9 }),
        entry({ courseId: "repeatable", gradeYear: 10 }),
      ],
      profile,
      catalog,
    });
    expect(warnings.filter((w) => w.id.startsWith("dup-"))).toEqual([]);
  });

  it("flags multi-term occupancy that runs past Term 4", () => {
    const warnings = validatePlan({
      entries: [entry({ courseId: "two-term", startTerm: 4, termSpan: 2 })],
      profile,
      catalog,
    });
    expect(warnings.some((w) => w.id.startsWith("overflow-") && w.severity === "error")).toBe(true);
  });

  it("accepts a prerequisite completed earlier in the plan", () => {
    const warnings = validatePlan({
      entries: [
        entry({ courseId: "art-1", gradeYear: 9, startTerm: 1 }),
        entry({ courseId: "advanced", gradeYear: 10, startTerm: 1 }),
      ],
      profile,
      catalog,
    });
    expect(warnings.filter((w) => w.id.startsWith("prereq-"))).toEqual([]);
  });

  it("warns when a prerequisite is not planned before the course", () => {
    const warnings = validatePlan({
      entries: [entry({ courseId: "advanced", gradeYear: 9, startTerm: 1 })],
      profile,
      catalog,
    });
    expect(warnings.some((w) => w.id.startsWith("prereq-") && w.severity === "warning")).toBe(true);
  });

  it("does not count a same-term course toward prerequisites", () => {
    const warnings = validatePlan({
      entries: [
        entry({ courseId: "art-1", gradeYear: 9, startTerm: 1 }),
        entry({ courseId: "advanced", gradeYear: 9, startTerm: 1 }),
      ],
      profile,
      catalog,
    });
    expect(warnings.some((w) => w.id.startsWith("prereq-"))).toBe(true);
  });
});
