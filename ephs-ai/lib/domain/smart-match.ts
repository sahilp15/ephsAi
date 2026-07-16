import { checkEligibility } from "./eligibility";
import type { CourseMeta, StudentProfile } from "./plan-types";

/**
 * Deterministic "Smart match mode" recommender.
 *
 * Used when the AI provider is unavailable or unconfigured, and as the
 * candidate-ranking stage of the AI pipeline. Pure and fully testable:
 * identical inputs always produce identical rankings.
 */

export interface SmartMatchInput {
  profile: StudentProfile;
  /** Grade level the recommendation targets (usually next grade). */
  targetGrade: number;
  completedCourseIds: ReadonlySet<string>;
  plannedCourseIds: ReadonlySet<string>;
  catalog: CourseMeta[];
  /** Free-text interest keywords parsed from the student's question. */
  queryKeywords: string[];
  /** Pathway names of interest. */
  pathwayNames: string[];
  limit?: number;
}

export interface SmartMatchResult {
  course: CourseMeta;
  score: number;
  reasons: string[];
  eligibilityStatus: ReturnType<typeof checkEligibility>["status"];
}

const STOPWORDS = new Set(
  "a an and are as at be but by can class classes course courses do for from get grade have i in interested interests is it like me my next of on or should so take that the to want what which with year".split(
    " ",
  ),
);

export function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
    ),
  );
}

export function smartMatch(input: SmartMatchInput): SmartMatchResult[] {
  const {
    profile,
    targetGrade,
    completedCourseIds,
    plannedCourseIds,
    catalog,
    queryKeywords,
    pathwayNames,
    limit = 12,
  } = input;

  const interestTerms = Array.from(
    new Set(
      [...profile.interests, ...profile.careerIdeas]
        .flatMap((t) => extractKeywords(t))
        .concat(queryKeywords),
    ),
  );

  const results: SmartMatchResult[] = [];
  const departmentCount = new Map<string, number>();

  for (const course of catalog) {
    if (completedCourseIds.has(course.id) || plannedCourseIds.has(course.id)) {
      continue;
    }
    const eligibility = checkEligibility(course, targetGrade, completedCourseIds);
    if (eligibility.status === "not_eligible_grade") continue;

    let score = 0;
    const reasons: string[] = [];

    // Interest-tag similarity against title/department/description words.
    const haystack =
      `${course.title} ${course.department} ${course.pathways.join(" ")}`.toLowerCase();
    const hits = interestTerms.filter((t) => haystack.includes(t));
    if (hits.length > 0) {
      score += Math.min(hits.length, 4) * 3;
      reasons.push(`Matches your interests: ${hits.slice(0, 4).join(", ")}`);
    }

    // Pathway alignment.
    const pathwayHits = course.pathways.filter((p) => pathwayNames.includes(p));
    if (pathwayHits.length > 0) {
      score += 4;
      reasons.push(`Part of the ${pathwayHits.join(" and ")} pathway`);
    }

    // Rigor preference.
    const advanced = course.flags.ap || course.flags.honors || course.collegeCredit;
    if (profile.apInterest || profile.rigor === "challenging") {
      if (advanced) {
        score += 3;
        reasons.push(
          course.flags.ap
            ? "AP course, matching your interest in advanced coursework"
            : "Advanced/college-credit option, matching your preferences",
        );
      }
    } else if (profile.rigor === "standard" && course.flags.ap) {
      score -= 2;
    }

    // Explicit graduation-rule value.
    if (course.gradStatements.length > 0) {
      score += 2;
      reasons.push("Fulfills a graduation-requirement statement in the guide");
    }

    // Fully eligible courses rank above uncertain ones (conservative bias).
    if (eligibility.status === "eligible") score += 2;
    else score -= 1;

    if (score <= 0) continue;
    results.push({ course, score, reasons, eligibilityStatus: eligibility.status });
  }

  // Deterministic ordering: score desc, then title for stability.
  results.sort(
    (a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title),
  );

  // Department diversity: cap over-represented departments in the top list.
  const diverse: SmartMatchResult[] = [];
  for (const r of results) {
    const count = departmentCount.get(r.course.department) ?? 0;
    if (count >= 3) continue;
    departmentCount.set(r.course.department, count + 1);
    diverse.push(r);
    if (diverse.length >= limit) break;
  }
  return diverse;
}
