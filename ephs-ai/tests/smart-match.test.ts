import { describe, expect, it } from "vitest";
import { smartMatch } from "@/lib/domain/smart-match";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";
import { makeCourse } from "./helpers";

const catalog = [
  makeCourse({ id: "robotics", title: "Robotics & Automation", department: "Tech Ed" }),
  makeCourse({
    id: "ap-cs",
    title: "AP Computer Science",
    department: "Business & Computer",
    flags: { ap: true, honors: false, capstone: false, skinny: false, cis: false, new_course: false },
  }),
  makeCourse({ id: "seniors-only", title: "Capstone Seminar", grades: [12] }),
  makeCourse({ id: "already-done", title: "Intro Robotics" }),
  makeCourse({ id: "art", title: "Painting I", department: "Art" }),
];

const baseInput = {
  profile: { ...DEFAULT_PROFILE, interests: ["robotics"], apInterest: true },
  targetGrade: 10,
  completedCourseIds: new Set(["already-done"]),
  plannedCourseIds: new Set<string>(),
  catalog,
  queryKeywords: ["robotics", "computer"],
  pathwayNames: [],
};

describe("smartMatch", () => {
  it("is deterministic for identical inputs", () => {
    const a = smartMatch(baseInput).map((r) => r.course.id);
    const b = smartMatch(baseInput).map((r) => r.course.id);
    expect(a).toEqual(b);
  });

  it("excludes completed courses and grade-ineligible courses", () => {
    const ids = smartMatch(baseInput).map((r) => r.course.id);
    expect(ids).not.toContain("already-done");
    expect(ids).not.toContain("seniors-only");
  });

  it("surfaces interest matches with explicit reasons", () => {
    const results = smartMatch(baseInput);
    const robotics = results.find((r) => r.course.id === "robotics");
    expect(robotics).toBeDefined();
    expect(robotics?.reasons.some((r) => r.includes("robotics"))).toBe(true);
    // Interest-matched courses outrank the unrelated art course.
    const ids = results.map((r) => r.course.id);
    expect(ids.indexOf("robotics")).toBeLessThan(
      ids.includes("art") ? ids.indexOf("art") : ids.length,
    );
  });

  it("boosts AP courses for students who want rigor", () => {
    const ids = smartMatch(baseInput).map((r) => r.course.id);
    expect(ids).toContain("ap-cs");
  });
});
