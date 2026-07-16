import type { CourseMeta } from "./plan-types";
import type { ParsedPrerequisite } from "./prerequisites";

/**
 * Deterministic eligibility engine — the single authority for eligibility
 * labels. The AI layer may explain these results but never overrides them.
 */

export type EligibilityStatus =
  | "eligible"
  | "not_eligible_grade"
  | "missing_prerequisite"
  | "prerequisite_unknown"
  | "counselor_verification_required";

export interface EligibilityResult {
  status: EligibilityStatus;
  /** Short human explanation. Raw prerequisite wording is always shown too. */
  explanation: string;
  /** For missing_prerequisite: OR-groups of course ids still unsatisfied. */
  missingGroups?: string[][];
}

export function checkGradeAllowed(
  course: Pick<CourseMeta, "grades">,
  studentGrade: number,
): boolean {
  return course.grades.length === 0 || course.grades.includes(studentGrade);
}

export function checkPrerequisite(
  prereq: ParsedPrerequisite,
  completedCourseIds: ReadonlySet<string>,
): EligibilityResult {
  switch (prereq.kind) {
    case "none":
      return { status: "eligible", explanation: "No prerequisite listed in the guide." };
    case "manual":
      return {
        status: "counselor_verification_required",
        explanation: `This prerequisite involves ${prereq.reason}, which this tool cannot verify. Please confirm with your counselor.`,
      };
    case "unknown":
      return {
        status: "prerequisite_unknown",
        explanation:
          "The guide's prerequisite wording could not be matched to catalog courses, so eligibility cannot be verified automatically.",
      };
    case "courses": {
      const missing = prereq.groups.filter(
        (group) => !group.some((id) => completedCourseIds.has(id)),
      );
      if (missing.length === 0) {
        return {
          status: "eligible",
          explanation: "Listed prerequisite courses are in your history.",
        };
      }
      return {
        status: "missing_prerequisite",
        explanation:
          "One or more prerequisite courses are not in your completed history.",
        missingGroups: missing,
      };
    }
  }
}

/**
 * Full eligibility check for a student considering a course at a given grade.
 * Grade ineligibility takes precedence; prerequisite checks run second.
 */
export function checkEligibility(
  course: CourseMeta,
  studentGrade: number,
  completedCourseIds: ReadonlySet<string>,
): EligibilityResult {
  if (!checkGradeAllowed(course, studentGrade)) {
    return {
      status: "not_eligible_grade",
      explanation: `The guide lists this course for grade(s) ${course.grades.join(", ")}.`,
    };
  }
  return checkPrerequisite(course.prereq, completedCourseIds);
}

export const ELIGIBILITY_LABELS: Record<EligibilityStatus, string> = {
  eligible: "Eligible",
  not_eligible_grade: "Not eligible for this grade",
  missing_prerequisite: "Missing prerequisite",
  prerequisite_unknown: "Prerequisite needs review",
  counselor_verification_required: "Counselor verification required",
};
