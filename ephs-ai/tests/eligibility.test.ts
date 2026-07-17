import { describe, expect, it } from "vitest";
import { checkEligibility } from "@/lib/domain/eligibility";
import { makeCourse } from "./helpers";

describe("checkEligibility", () => {
  it("rejects a grade the guide does not allow", () => {
    const course = makeCourse({ id: "ap-chem", grades: [11, 12] });
    expect(checkEligibility(course, 9, new Set()).status).toBe("not_eligible_grade");
    expect(checkEligibility(course, 11, new Set()).status).toBe("eligible");
  });

  it("is eligible when no prerequisite is listed", () => {
    const course = makeCourse({ id: "art-1" });
    expect(checkEligibility(course, 10, new Set()).status).toBe("eligible");
  });

  it("checks AND groups - every group needs a satisfied option", () => {
    const course = makeCourse({
      id: "physics",
      prereq: { kind: "courses", raw: "a and b", groups: [["a"], ["b"]] },
    });
    expect(checkEligibility(course, 11, new Set(["a"])).status).toBe("missing_prerequisite");
    expect(checkEligibility(course, 11, new Set(["a", "b"])).status).toBe("eligible");
  });

  it("checks OR groups - any option satisfies the group", () => {
    const course = makeCourse({
      id: "adv",
      prereq: { kind: "courses", raw: "a or b", groups: [["a", "b"]] },
    });
    expect(checkEligibility(course, 11, new Set(["b"])).status).toBe("eligible");
  });

  it("reports missing groups for guidance", () => {
    const course = makeCourse({
      id: "adv",
      prereq: { kind: "courses", raw: "a and b", groups: [["a"], ["b"]] },
    });
    const result = checkEligibility(course, 11, new Set(["a"]));
    expect(result.missingGroups).toEqual([["b"]]);
  });

  it("labels ambiguous prerequisites unknown rather than guessing", () => {
    const course = makeCourse({
      id: "mystery",
      prereq: { kind: "unknown", raw: "Two Ceramics Courses" },
    });
    expect(checkEligibility(course, 11, new Set()).status).toBe("prerequisite_unknown");
  });

  it("routes manual criteria to counselor verification", () => {
    const course = makeCourse({
      id: "avid",
      prereq: { kind: "manual", raw: "application", reason: "application required" },
    });
    expect(checkEligibility(course, 9, new Set()).status).toBe(
      "counselor_verification_required",
    );
  });
});
