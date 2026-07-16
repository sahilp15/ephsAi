import { NextRequest, NextResponse } from "next/server";
import { runRecommendation } from "@/lib/ai/pipeline";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { recommendRequestSchema } from "@/lib/ai/schema";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/recommend — grounded course recommendations.
 * Accepts anonymized planning context only (no names or emails), is
 * rate-limited per IP, and aborts the model call if the client disconnects.
 */
export async function POST(request: NextRequest) {
  const env = getEnv();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limit = checkRateLimit(`recommend:${ip}`, env.AI_RATE_LIMIT_PER_HOUR);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You have reached the hourly limit for AI recommendations. Please try again later — the catalog and planner remain fully available.",
        resetAt: limit.resetAt,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = recommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Request failed validation.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const result = await runRecommendation(parsed.data, request.signal);
    console.info(
      `[recommend] mode=${result.mode} items=${result.response.recommendations.length} ms=${Date.now() - started}`,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "[recommend] pipeline failure:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error: "internal",
        message:
          "Recommendations are temporarily unavailable. The catalog and planner remain fully functional.",
      },
      { status: 500 },
    );
  }
}
