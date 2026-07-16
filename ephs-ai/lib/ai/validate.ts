import type { EligibilityResult } from "@/lib/domain/eligibility";
import type { CandidateForModel } from "./prompt";
import {
  recommendationResponseSchema,
  type RecommendationItem,
  type RecommendationResponse,
} from "./schema";

/**
 * Pure, deterministic post-validation of model output. Kept free of any
 * server-only imports so it is directly unit-testable.
 */

/** Map the deterministic engine status onto the response contract. The model never upgrades eligibility. */
export function engineStatusToResponseStatus(
  e: EligibilityResult,
): RecommendationItem["eligibilityStatus"] {
  switch (e.status) {
    case "eligible":
      return "eligible";
    case "missing_prerequisite":
      return "not_currently_eligible";
    case "prerequisite_unknown":
    case "counselor_verification_required":
      return "counselor_verification_required";
    case "not_eligible_grade":
      return "not_currently_eligible";
  }
}

/**
 * Validates raw model output against the Zod schema, rejects hallucinated or
 * out-of-set course IDs, re-applies engine eligibility, and restricts
 * citations to each course's real source pages. Returns null when nothing
 * usable survives (caller falls back to Smart match mode).
 */
export function sanitizeModelResponse(
  raw: unknown,
  candidates: CandidateForModel[],
): RecommendationResponse | null {
  const parsed = recommendationResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  const byId = new Map(candidates.map((c) => [c.meta.id, c]));
  const items: RecommendationItem[] = [];
  for (const rec of parsed.data.recommendations) {
    const candidate = byId.get(rec.courseId);
    if (!candidate) continue; // hallucinated or out-of-set ID → rejected

    const engineStatus = engineStatusToResponseStatus(candidate.eligibility);
    const validPages = new Set(candidate.meta.sourcePages);
    const citedPages = rec.sourcePages.filter((p) => validPages.has(p));
    items.push({
      ...rec,
      // The deterministic engine is the authority for eligibility.
      eligibilityStatus:
        rec.eligibilityStatus === engineStatus ||
        (engineStatus === "eligible" &&
          rec.eligibilityStatus === "possibly_eligible")
          ? rec.eligibilityStatus
          : engineStatus,
      // Citations must come from the course's real source pages.
      sourcePages: citedPages.length > 0 ? citedPages : candidate.meta.sourcePages,
      alternativeCourseIds: rec.alternativeCourseIds.filter((id) =>
        byId.has(id),
      ),
    });
  }
  if (items.length === 0) return null;

  items.sort((a, b) => a.rank - b.rank);
  items.forEach((item, i) => {
    item.rank = i + 1;
  });
  return { ...parsed.data, recommendations: items };
}
