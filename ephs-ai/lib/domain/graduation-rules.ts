import type { CourseMeta, StudentProfile } from "./plan-types";

/**
 * Graduation-rule engine.
 *
 * Only rules explicitly stated in the 2026-27 EPHS Course Guide are encoded:
 *  - Class of 2027: technology credit required (guide page 2)
 *  - Class of 2028 and beyond: personal finance credit required (guide page 2)
 *  - Arts requirement: eligible-course list (from the guide's arts pages)
 *  - Per-course graduation-requirement statements
 *
 * The guide does NOT provide a complete numerical credit-audit table, so this
 * engine reports three honest buckets instead of inventing a percentage:
 * verified satisfied, verified open, and needs counselor confirmation.
 */

export type RequirementState = "satisfied" | "open" | "needs_confirmation";

export interface RequirementReportItem {
  id: string;
  title: string;
  state: RequirementState;
  detail: string;
  /** Course ids in the student's history/plan that contribute. */
  matchedCourseIds: string[];
  sourcePages: number[];
}

export interface GraduationReport {
  graduationYear: number;
  items: RequirementReportItem[];
  /** Guide statements matched by the student's courses (informational). */
  statementMatches: Array<{
    statement: string;
    courseIds: string[];
  }>;
  counselorNote: string;
}

const TECH_STATEMENT = /technology graduation requirement/i;
const PERSONAL_FINANCE_STATEMENT = /personal finance graduation requirement/i;

export function coursesFulfillingTechnology(catalog: CourseMeta[]): CourseMeta[] {
  return catalog.filter((c) =>
    c.gradStatements.some((s) => TECH_STATEMENT.test(s)),
  );
}

export function coursesFulfillingPersonalFinance(
  catalog: CourseMeta[],
  qualifyingNames: string[],
): CourseMeta[] {
  const namesLower = qualifyingNames.map((n) => n.toLowerCase());
  return catalog.filter(
    (c) =>
      c.gradStatements.some((s) => PERSONAL_FINANCE_STATEMENT.test(s)) ||
      namesLower.includes(c.title.toLowerCase()),
  );
}

export interface GraduationRuleInputs {
  profile: Pick<StudentProfile, "graduationYear" | "completedCourseIds">;
  /** All course ids in history plus plan entries with status planned/completed. */
  plannedOrCompletedIds: string[];
  catalog: CourseMeta[];
  /** From dataset graduation_rules.class_of_2028_and_beyond. */
  qualifyingPersonalFinanceCourses: string[];
  /** Arts-requirement eligible course names by department, from the dataset. */
  artsEligibleByDepartment: Record<string, string[]>;
  rulesSourcePage: number;
}

export function buildGraduationReport(
  input: GraduationRuleInputs,
): GraduationReport {
  const {
    profile,
    plannedOrCompletedIds,
    catalog,
    qualifyingPersonalFinanceCourses,
    artsEligibleByDepartment,
    rulesSourcePage,
  } = input;
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const taken = plannedOrCompletedIds
    .map((id) => byId.get(id))
    .filter((c): c is CourseMeta => Boolean(c));

  const items: RequirementReportItem[] = [];

  // --- Class-year-specific rule (guide page 2) ---
  if (profile.graduationYear <= 2027) {
    const techCourses = coursesFulfillingTechnology(catalog);
    const matched = taken.filter((c) => techCourses.some((t) => t.id === c.id));
    items.push({
      id: "technology-credit",
      title: `Technology credit (Class of ${profile.graduationYear})`,
      state: matched.length > 0 ? "satisfied" : "open",
      detail:
        matched.length > 0
          ? "A course fulfilling the technology graduation requirement is in your history or plan."
          : "The guide states a technology credit is required for the Class of 2027. No fulfilling course is in your history or plan yet.",
      matchedCourseIds: matched.map((c) => c.id),
      sourcePages: [rulesSourcePage],
    });
  } else {
    const pfCourses = coursesFulfillingPersonalFinance(
      catalog,
      qualifyingPersonalFinanceCourses,
    );
    const matched = taken.filter((c) => pfCourses.some((t) => t.id === c.id));
    items.push({
      id: "personal-finance-credit",
      title: "Personal finance credit (Class of 2028 and beyond)",
      state: matched.length > 0 ? "satisfied" : "open",
      detail:
        matched.length > 0
          ? "A qualifying personal-finance course is in your history or plan."
          : `The guide states a personal finance credit is required for the Class of 2028 and beyond (qualifying courses: ${qualifyingPersonalFinanceCourses.join(", ")}).`,
      matchedCourseIds: matched.map((c) => c.id),
      sourcePages: [rulesSourcePage],
    });
  }

  // --- Arts requirement (eligible-course list from the guide) ---
  const artsNames = new Set(
    Object.values(artsEligibleByDepartment)
      .flat()
      .map((n) => n.toLowerCase()),
  );
  const artsMatched = taken.filter((c) => artsNames.has(c.title.toLowerCase()));
  items.push({
    id: "arts-requirement",
    title: "Arts requirement",
    state: artsMatched.length > 0 ? "satisfied" : "open",
    detail:
      artsMatched.length > 0
        ? "A course from the guide's arts-requirement eligible list is in your history or plan."
        : "No course from the guide's arts-requirement eligible list is in your history or plan yet. The exact number of required arts credits must be confirmed with your counselor.",
    matchedCourseIds: artsMatched.map((c) => c.id),
    sourcePages: [],
  });

  // --- Everything else is honestly not encodable from this guide ---
  items.push({
    id: "full-credit-audit",
    title: "Complete credit audit (all subject areas)",
    state: "needs_confirmation",
    detail:
      "The 2026-27 Course Guide does not publish a complete numerical graduation credit table. Totals for English, math, science, social studies, PE/health, and electives must be verified with your counselor.",
    matchedCourseIds: [],
    sourcePages: [],
  });

  // --- Informational statement matches ---
  const statementMap = new Map<string, string[]>();
  for (const c of taken) {
    for (const s of c.gradStatements) {
      const list = statementMap.get(s) ?? [];
      list.push(c.id);
      statementMap.set(s, list);
    }
  }
  const statementMatches = Array.from(statementMap.entries()).map(
    ([statement, courseIds]) => ({ statement, courseIds }),
  );

  return {
    graduationYear: profile.graduationYear,
    items,
    statementMatches,
    counselorNote:
      "This tool uses the 2026-27 EPHS Course Guide. Some graduation and scheduling decisions require counselor verification.",
  };
}
