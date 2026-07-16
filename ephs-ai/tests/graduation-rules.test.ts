import { describe, expect, it } from "vitest";
import { buildGraduationReport } from "@/lib/domain/graduation-rules";
import { makeCourse } from "./helpers";

const catalog = [
  makeCourse({
    id: "computer-tech",
    title: "Computer Technology",
    gradStatements: ["the Technology graduation requirement for class of 2027"],
  }),
  makeCourse({
    id: "personal-finance",
    title: "Personal Finance",
    gradStatements: [
      "Personal Finance graduation requirement for class of 2028 and beyond",
    ],
  }),
  makeCourse({ id: "ceramics-i", title: "Ceramics I" }),
  makeCourse({ id: "algebra", title: "Algebra" }),
];

const artsEligible = { Art: ["Ceramics I"] };

function report(gradYear: number, taken: string[]) {
  return buildGraduationReport({
    profile: { graduationYear: gradYear, completedCourseIds: taken },
    plannedOrCompletedIds: taken,
    catalog,
    qualifyingPersonalFinanceCourses: ["Personal Finance", "Finance for Your Future"],
    artsEligibleByDepartment: artsEligible,
    rulesSourcePage: 2,
  });
}

describe("buildGraduationReport", () => {
  it("applies the Class of 2027 technology rule", () => {
    const r = report(2027, []);
    const tech = r.items.find((i) => i.id === "technology-credit");
    expect(tech?.state).toBe("open");
    expect(r.items.find((i) => i.id === "personal-finance-credit")).toBeUndefined();

    const satisfied = report(2027, ["computer-tech"]);
    expect(satisfied.items.find((i) => i.id === "technology-credit")?.state).toBe("satisfied");
  });

  it("applies the Class of 2028+ personal-finance rule", () => {
    const r = report(2028, []);
    const pf = r.items.find((i) => i.id === "personal-finance-credit");
    expect(pf?.state).toBe("open");
    expect(r.items.find((i) => i.id === "technology-credit")).toBeUndefined();

    const satisfied = report(2028, ["personal-finance"]);
    expect(satisfied.items.find((i) => i.id === "personal-finance-credit")?.state).toBe(
      "satisfied",
    );
  });

  it("matches the arts requirement from the guide's eligible list", () => {
    expect(report(2029, []).items.find((i) => i.id === "arts-requirement")?.state).toBe("open");
    expect(
      report(2029, ["ceramics-i"]).items.find((i) => i.id === "arts-requirement")?.state,
    ).toBe("satisfied");
  });

  it("always reports the full credit audit as needing counselor confirmation", () => {
    const audit = report(2029, ["ceramics-i", "personal-finance"]).items.find(
      (i) => i.id === "full-credit-audit",
    );
    expect(audit?.state).toBe("needs_confirmation");
  });

  it("cites the rule source page", () => {
    const r = report(2027, []);
    expect(r.items.find((i) => i.id === "technology-credit")?.sourcePages).toEqual([2]);
  });
});
