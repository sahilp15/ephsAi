import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { extractAndMatchTranscript } from "@/lib/transcript/extract";
import { getEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

/**
 * POST /api/demo/transcript/upload - the no-login preview of the transcript
 * upload. It runs the exact same extraction + catalog-matching pipeline as the
 * authenticated `/api/transcript/upload` route (`extractAndMatchTranscript`),
 * but it never stores the file or writes to the database: the matched rows are
 * returned straight to the browser, which holds them for the review step. This
 * lets reviewers verify the feature end to end while Google sign-in approval is
 * pending, without touching any student data.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limit = checkRateLimit(`demo-transcript-upload:${ip}`, 20);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many uploads. Please wait a bit and try again." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file", message: "Please choose a file." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "invalid_type", message: "Only PDF, PNG, JPG, or JPEG files are accepted." },
      { status: 400 },
    );
  }
  const maxBytes = getEnv().MAX_TRANSCRIPT_UPLOAD_MB * 1024 * 1024;
  if (file.size === 0) {
    return NextResponse.json({ error: "empty", message: "That file appears to be empty." }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: "too_large",
        message: `Files must be ${getEnv().MAX_TRANSCRIPT_UPLOAD_MB} MB or smaller.`,
      },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let extracted;
  try {
    extracted = await extractAndMatchTranscript({
      bytes,
      mimeType: file.type,
      filename: file.name.slice(0, 200),
    });
  } catch (err) {
    console.error(
      "[demo-transcript] extraction failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error: "processing_failed",
        message:
          "We couldn't read this transcript automatically. You can still add courses by hand on the next screen.",
      },
      { status: 200 },
    );
  }

  // Shape rows to match what the review screen consumes (mirrors the mapping in
  // app/transcript/[id]/page.tsx for the authenticated flow).
  const rows = extracted.rows.map((r) => ({
    rowId: randomUUID(),
    rawName: r.rawCourseName,
    originalCourseName: r.rawCourseName,
    courseId: r.matchedCourseId,
    recordType: r.inProgress ? "in_progress" : r.isTransfer ? "transfer" : "completed",
    gradeLevel: r.gradeLevel,
    term: r.term,
    finalGrade: r.finalGrade,
    creditsEarned: r.creditsEarned,
    isHonors: r.isHonors,
    isAp: r.isAp,
    isTransfer: r.isTransfer,
    confidence: r.matchConfidence,
  }));

  return NextResponse.json({
    id: randomUUID(),
    filename: file.name.slice(0, 200),
    rows,
    warnings: extracted.warnings,
  });
}
