import { z } from "zod";

/**
 * Structured output contract for the AI recommender. Model output is parsed
 * with these schemas; anything that fails validation is rejected before it
 * can reach a student.
 */

export const eligibilityStatusSchema = z.enum([
  "eligible",
  "possibly_eligible",
  "not_currently_eligible",
  "counselor_verification_required",
]);

export const recommendationItemSchema = z.object({
  courseId: z.string().min(1),
  rank: z.number().int().positive(),
  fitSummary: z.string().min(1),
  whyItMatches: z.string().min(1),
  eligibilityStatus: eligibilityStatusSchema,
  prerequisiteExplanation: z.string().default(""),
  graduationOrPathwayValue: z.string().default(""),
  planningConsiderations: z.string().default(""),
  sourcePages: z.array(z.number().int().positive()).default([]),
  alternativeCourseIds: z.array(z.string()).default([]),
});

export const recommendationResponseSchema = z.object({
  summary: z.string().min(1),
  recommendations: z.array(recommendationItemSchema).min(1).max(10),
  assumptions: z.array(z.string()).default([]),
  questionsForStudent: z.array(z.string()).default([]),
  counselorVerificationItems: z.array(z.string()).default([]),
});

export type RecommendationItem = z.infer<typeof recommendationItemSchema>;
export type RecommendationResponse = z.infer<
  typeof recommendationResponseSchema
>;

/** A single turn in the chat conversation. */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Request body accepted by POST /api/chat. */
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(24),
  profile: z
    .object({
      graduationYear: z.number().int().min(2026).max(2035),
      currentGrade: z.union([
        z.literal(9),
        z.literal(10),
        z.literal(11),
        z.literal(12),
      ]),
      interests: z.array(z.string().max(100)).max(20).default([]),
      careerIdeas: z.array(z.string().max(100)).max(20).default([]),
      rigor: z.enum(["standard", "balanced", "challenging"]).default("balanced"),
      apInterest: z.boolean().default(false),
      pathwayIds: z.array(z.string().max(100)).max(5).default([]),
    })
    .optional(),
  completedCourseIds: z.array(z.string().max(200)).max(200).default([]),
  plannedCourseIds: z.array(z.string().max(200)).max(200).default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Legacy recommendation request shape (kept for the deterministic pipeline and its tests). */
export const recommendRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  profile: z.object({
    graduationYear: z.number().int().min(2026).max(2035),
    currentGrade: z.union([
      z.literal(9),
      z.literal(10),
      z.literal(11),
      z.literal(12),
    ]),
    interests: z.array(z.string().max(100)).max(20).default([]),
    careerIdeas: z.array(z.string().max(100)).max(20).default([]),
    rigor: z.enum(["standard", "balanced", "challenging"]).default("balanced"),
    apInterest: z.boolean().default(false),
    pathwayIds: z.array(z.string().max(100)).max(5).default([]),
  }),
  completedCourseIds: z.array(z.string().max(200)).max(200).default([]),
  plannedCourseIds: z.array(z.string().max(200)).max(200).default([]),
  /** Grade level the advice targets; defaults to the student's next grade. */
  targetGrade: z.number().int().min(9).max(12).optional(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
