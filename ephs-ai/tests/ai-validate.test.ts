import { describe, expect, it } from "vitest";
import { sanitizeModelResponse } from "@/lib/ai/validate";
import { recommendationResponseSchema } from "@/lib/ai/schema";
import type { CandidateForModel } from "@/lib/ai/prompt";
import { makeCourse } from "./helpers";

function candidate(id: string, opts?: Partial<CandidateForModel>): CandidateForModel {
  return {
    meta: makeCourse({ id, sourcePages: [16, 17] }),
    description: "desc",
    prerequisiteRaw: null,
    notes: [],
    eligibility: { status: "eligible", explanation: "ok" },
    ...opts,
  };
}

function modelResponse(recs: Array<Record<string, unknown>>) {
  return {
    summary: "Here are some ideas",
    recommendations: recs,
    assumptions: [],
    questionsForStudent: [],
    counselorVerificationItems: [],
  };
}

function rec(courseId: string, overrides: Record<string, unknown> = {}) {
  return {
    courseId,
    rank: 1,
    fitSummary: "fits",
    whyItMatches: "because",
    eligibilityStatus: "eligible",
    prerequisiteExplanation: "",
    graduationOrPathwayValue: "",
    planningConsiderations: "",
    sourcePages: [16],
    alternativeCourseIds: [],
    ...overrides,
  };
}

describe("AI response schema", () => {
  it("accepts a valid structured response", () => {
    const parsed = recommendationResponseSchema.safeParse(modelResponse([rec("a")]));
    expect(parsed.success).toBe(true);
  });

  it("rejects malformed output", () => {
    expect(recommendationResponseSchema.safeParse({ summary: "x" }).success).toBe(false);
    expect(
      recommendationResponseSchema.safeParse(
        modelResponse([rec("a", { eligibilityStatus: "definitely" })]),
      ).success,
    ).toBe(false);
  });
});

describe("sanitizeModelResponse", () => {
  it("rejects hallucinated course IDs not in the candidate set", () => {
    const result = sanitizeModelResponse(
      modelResponse([rec("real"), rec("invented-course", { rank: 2 })]),
      [candidate("real")],
    );
    expect(result?.recommendations.map((r) => r.courseId)).toEqual(["real"]);
  });

  it("returns null when every recommendation is hallucinated", () => {
    const result = sanitizeModelResponse(modelResponse([rec("ghost")]), [candidate("real")]);
    expect(result).toBeNull();
  });

  it("never lets the model upgrade engine eligibility", () => {
    const result = sanitizeModelResponse(modelResponse([rec("gated")]), [
      candidate("gated", {
        eligibility: { status: "missing_prerequisite", explanation: "missing" },
      }),
    ]);
    expect(result?.recommendations[0]?.eligibilityStatus).toBe("not_currently_eligible");
  });

  it("drops citations to pages the course does not appear on", () => {
    const result = sanitizeModelResponse(
      modelResponse([rec("a", { sourcePages: [16, 99] })]),
      [candidate("a")],
    );
    expect(result?.recommendations[0]?.sourcePages).toEqual([16]);
  });

  it("falls back to the course's real pages when the model cites none correctly", () => {
    const result = sanitizeModelResponse(
      modelResponse([rec("a", { sourcePages: [99] })]),
      [candidate("a")],
    );
    expect(result?.recommendations[0]?.sourcePages).toEqual([16, 17]);
  });

  it("filters alternative IDs to the candidate set and renumbers ranks", () => {
    const result = sanitizeModelResponse(
      modelResponse([
        rec("b", { rank: 5, alternativeCourseIds: ["a", "ghost"] }),
        rec("a", { rank: 2 }),
      ]),
      [candidate("a"), candidate("b")],
    );
    expect(result?.recommendations.map((r) => [r.courseId, r.rank])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect(result?.recommendations[1]?.alternativeCourseIds).toEqual(["a"]);
  });
});
