import { NextRequest } from "next/server";
import {
  getFeedbackAdapter,
  sanitizeFeedback,
  type FeedbackPayload,
} from "@/lib/feedback";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Partial<FeedbackPayload>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Sanitize: only known, non-PII fields survive; lengths are capped.
  const payload = sanitizeFeedback(body);

  try {
    await getFeedbackAdapter().save(payload);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/feedback] save error:", err);
    // Never block the user on a feedback failure.
    return Response.json({ ok: true, stored: false });
  }
}
