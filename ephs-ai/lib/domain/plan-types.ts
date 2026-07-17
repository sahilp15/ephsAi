/**
 * Student profile and four-year plan models.
 *
 * EPHS runs a four-term school year (Term 1-4). A "semester" course spans
 * two consecutive terms per the guide's EP Online definition.
 */

export const GRADE_YEARS = [9, 10, 11, 12] as const;
export type GradeYear = (typeof GRADE_YEARS)[number];

export const TERMS = [1, 2, 3, 4] as const;
export type Term = (typeof TERMS)[number];

export type PlanEntryStatus = "planned" | "completed" | "considering";

export interface PlanEntry {
  id: string;
  courseId: string;
  gradeYear: GradeYear;
  /** First term the course occupies (1-4). */
  startTerm: Term;
  /** Number of consecutive terms occupied (derived from the guide; 1 when unknown). */
  termSpan: number;
  status: PlanEntryStatus;
  note?: string;
}

export type RigorPreference = "standard" | "balanced" | "challenging";

export interface StudentProfile {
  displayName: string;
  graduationYear: number;
  currentGrade: GradeYear;
  interests: string[];
  careerIdeas: string[];
  rigor: RigorPreference;
  apInterest: boolean;
  pathwayIds: string[];
  /** Courses already completed or in progress, matched to catalog ids. */
  completedCourseIds: string[];
  /** Names the student entered that we could not match to the catalog. */
  unmatchedHistory: string[];
  onboardingCompleted: boolean;
}

export const DEFAULT_PROFILE: StudentProfile = {
  displayName: "",
  graduationYear: 2029,
  currentGrade: 9,
  interests: [],
  careerIdeas: [],
  rigor: "balanced",
  apInterest: false,
  pathwayIds: [],
  completedCourseIds: [],
  unmatchedHistory: [],
  onboardingCompleted: false,
};

/** Compact course record shipped to the client for planner validation. */
export interface CourseMeta {
  id: string;
  title: string;
  department: string;
  grades: number[];
  creditsRaw: string | null;
  termSpan: number | null;
  termLabel: string;
  spanRequiresVerification: boolean;
  repeatable: boolean;
  prereq: import("./prerequisites").ParsedPrerequisite;
  flags: {
    ap: boolean;
    honors: boolean;
    capstone: boolean;
    skinny: boolean;
    cis: boolean;
    new_course: boolean;
  };
  gradStatements: string[];
  pathways: string[];
  sourcePages: number[];
  collegeCredit: boolean;
}
