import "server-only";
import { getCourseById } from "@/lib/catalog/store";
import { getCourseMetaList } from "@/lib/catalog/meta";
import { checkEligibility } from "@/lib/domain/eligibility";
import { extractKeywords, smartMatch } from "@/lib/domain/smart-match";
import type { CourseMeta, StudentProfile } from "@/lib/domain/plan-types";
import { DEFAULT_PROFILE } from "@/lib/domain/plan-types";
import { aiEnabled } from "@/lib/env";
import { getAIProvider } from "./openai-provider";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type CandidateForModel,
} from "./prompt";
import type {
  RecommendRequest,
  RecommendationItem,
  RecommendationResponse,
} from "./schema";
import { engineStatusToResponseStatus, sanitizeModelResponse } from "./validate";

/**
 * Grounded recommendation pipeline:
 *
 *  1. Deterministic candidate retrieval (grade eligibility, interest and
 *     query relevance, pathway alignment, rigor fit) - never the full guide.
 *  2. Deterministic eligibility per candidate, computed BEFORE the model runs.
 *  3. Model call (OpenAI, JSON mode) restricted to candidate course IDs.
 *  4. Zod validation of the raw output.
 *  5. Rejection of any course ID outside the candidate set (hallucination guard).
 *  6. Engine eligibility re-applied - the model can never upgrade a status.
 *  7. Citations restricted to each course's real source pages.
 *  8. Deterministic "Smart match mode" fallback when the model is
 *     unavailable, unconfigured, or returns unusable output.
 */

export type RecommendationMode = "ai" | "smart_match";

export interface PipelineResult {
  mode: RecommendationMode;
  model?: string;
  response: RecommendationResponse;
}

const CANDIDATE_LIMIT = 24;

function profileFromRequest(req: RecommendRequest): StudentProfile {
  return {
    ...DEFAULT_PROFILE,
    graduationYear: req.profile.graduationYear,
    currentGrade: req.profile.currentGrade,
    interests: req.profile.interests,
    careerIdeas: req.profile.careerIdeas,
    rigor: req.profile.rigor,
    apInterest: req.profile.apInterest,
    pathwayIds: req.profile.pathwayIds,
    completedCourseIds: req.completedCourseIds,
  };
}

function pathwayNamesFromIds(ids: string[]): string[] {
  const map: Record<string, string> = {
    "business-management": "Business & Management",
    "human-public-services": "Human & Public Services",
    "natural-applied-sciences": "Natural & Applied Sciences",
    "engineering-technology-manufacturing": "Engineering, Technology & Manufacturing",
    "communication-arts": "Communication & Arts",
  };
  return ids.map((id) => map[id]).filter((n): n is string => Boolean(n));
}

export function buildCandidates(req: RecommendRequest): CandidateForModel[] {
  const profile = profileFromRequest(req);
  const targetGrade = req.targetGrade ?? Math.min(12, profile.currentGrade + 1);
  const completed = new Set(req.completedCourseIds);
  const planned = new Set(req.plannedCourseIds);
  const pathwayNames = pathwayNamesFromIds(req.profile.pathwayIds);
  const catalog = getCourseMetaList();

  const ranked = smartMatch({
    profile,
    targetGrade,
    completedCourseIds: completed,
    plannedCourseIds: planned,
    catalog,
    queryKeywords: extractKeywords(req.message),
    pathwayNames,
    limit: CANDIDATE_LIMIT,
  });

  // Ensure courses named directly in the question are considered even when
  // interest scoring missed them (e.g. "Can I take AP Computer Science A?").
  const msg = req.message.toLowerCase();
  const direct = catalog.filter(
    (c) =>
      c.title.length >= 6 &&
      msg.includes(c.title.toLowerCase()) &&
      !completed.has(c.id) &&
      c.grades.includes(targetGrade),
  );

  const chosen = new Map<string, CourseMeta>();
  for (const d of direct) chosen.set(d.id, d);
  for (const r of ranked) {
    if (chosen.size >= CANDIDATE_LIMIT) break;
    chosen.set(r.course.id, r.course);
  }

  return Array.from(chosen.values()).map((meta) => {
    const full = getCourseById(meta.id);
    return {
      meta,
      description: full?.description ?? "",
      prerequisiteRaw: full?.prerequisite_raw ?? null,
      notes: full?.notes ?? [],
      eligibility: checkEligibility(meta, targetGrade, completed),
    };
  });
}

function smartMatchResponse(
  req: RecommendRequest,
  candidates: CandidateForModel[],
): RecommendationResponse {
  const items: RecommendationItem[] = candidates
    .slice(0, 6)
    .map((c, i) => ({
      courseId: c.meta.id,
      rank: i + 1,
      fitSummary: `${c.meta.title} (${c.meta.department}) aligns with your stated interests and grade level.`,
      whyItMatches: [
        c.meta.pathways.length > 0
          ? `Listed under the ${c.meta.pathways.join(" and ")} pathway${c.meta.pathways.length > 1 ? "s" : ""}.`
          : null,
        c.meta.gradStatements.length > 0
          ? `The guide states it fulfills: ${c.meta.gradStatements.join("; ")}.`
          : null,
        c.meta.flags.ap ? "This is an AP course." : null,
        c.meta.collegeCredit ? "College credit is available per the guide." : null,
      ]
        .filter(Boolean)
        .join(" ") || "Matches your grade level and preferences in the guide.",
      eligibilityStatus: engineStatusToResponseStatus(c.eligibility),
      prerequisiteExplanation: c.prerequisiteRaw
        ? `Guide prerequisite: “${c.prerequisiteRaw}”. ${c.eligibility.explanation}`
        : "No prerequisite listed in the guide.",
      graduationOrPathwayValue: c.meta.gradStatements.join("; "),
      planningConsiderations: `Credits: ${c.meta.creditsRaw ?? "see guide"} · Length: ${c.meta.termLabel}`,
      sourcePages: c.meta.sourcePages,
      alternativeCourseIds: [],
    }));

  return {
    summary:
      "Smart match mode: these deterministic suggestions are ranked by grade eligibility, prerequisite fit, interest similarity, pathway alignment, and graduation-requirement value from the official guide. AI explanations are unavailable right now.",
    recommendations: items,
    assumptions: [
      `Recommendations target grade ${req.targetGrade ?? Math.min(12, req.profile.currentGrade + 1)}.`,
    ],
    questionsForStudent: [],
    counselorVerificationItems: [
      "Confirm final course selections, scheduling, and any prerequisite questions with your counselor.",
    ],
  };
}

export async function runRecommendation(
  req: RecommendRequest,
  signal?: AbortSignal,
): Promise<PipelineResult> {
  const candidates = buildCandidates(req);

  if (candidates.length === 0) {
    return {
      mode: "smart_match",
      response: {
        summary:
          "No catalog courses matched your question and grade level. Try describing your interests differently, or browse the full catalog.",
        recommendations: [],
        assumptions: [],
        questionsForStudent: [
          "What subjects or activities do you enjoy most?",
        ],
        counselorVerificationItems: [],
      },
    };
  }

  if (!aiEnabled()) {
    return { mode: "smart_match", response: smartMatchResponse(req, candidates) };
  }

  try {
    const provider = getAIProvider();
    const student = {
      targetGrade: req.targetGrade ?? Math.min(12, req.profile.currentGrade + 1),
      graduationYear: req.profile.graduationYear,
      interests: req.profile.interests,
      careerIdeas: req.profile.careerIdeas,
      rigor: req.profile.rigor,
      apInterest: req.profile.apInterest,
      pathwayNames: pathwayNamesFromIds(req.profile.pathwayIds),
      completedCourseTitles: req.completedCourseIds
        .map((id) => getCourseById(id)?.title)
        .filter((t): t is string => Boolean(t)),
      plannedCourseTitles: req.plannedCourseIds
        .map((id) => getCourseById(id)?.title)
        .filter((t): t is string => Boolean(t)),
    };

    const result = await provider.complete({
      system: buildSystemPrompt(),
      user: buildUserPrompt(req.message, student, candidates),
      maxTokens: 3000,
      signal,
    });

    let json: unknown;
    try {
      json = JSON.parse(result.text);
    } catch {
      json = null;
    }
    const sanitized = json ? sanitizeModelResponse(json, candidates) : null;
    if (sanitized) {
      return { mode: "ai", model: result.model, response: sanitized };
    }
    console.warn("[recommend] model output failed validation; using smart match");
    return { mode: "smart_match", response: smartMatchResponse(req, candidates) };
  } catch (err) {
    // Fail gracefully: the product stays useful without the model.
    console.error(
      "[recommend] AI provider error:",
      err instanceof Error ? err.message : err,
    );
    return { mode: "smart_match", response: smartMatchResponse(req, candidates) };
  }
}
