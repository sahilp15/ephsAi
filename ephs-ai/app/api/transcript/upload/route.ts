import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/auth/audit";
import { processTranscript } from "@/lib/transcript/process";
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
 * POST /api/transcript/upload - accept a transcript file, store it privately,
 * record it, and kick off extraction + catalog matching. Enforces
 * authentication (student), file type + size limits, and per-user rate limits.
 * The file is written under `{userId}/...` in a private bucket; its location is
 * never returned to the client.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (user.role !== "student") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = checkRateLimit(`transcript-upload:${user.id}`, 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many uploads. Please wait a bit and try again." },
      { status: 429 },
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
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

  const transcriptId = randomUUID();
  const bucket = getEnv().TRANSCRIPT_BUCKET;
  const storagePath = `${user.id}/${transcriptId}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadErr) {
    console.error("[transcript] upload error:", uploadErr.message);
    return NextResponse.json(
      { error: "upload_failed", message: "We couldn't save that file. Please try again." },
      { status: 500 },
    );
  }

  const { error: insertErr } = await supabase.from("transcripts").insert({
    id: transcriptId,
    student_id: user.id,
    storage_path: storagePath,
    original_filename: file.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    status: "uploaded",
  });
  if (insertErr) {
    console.error("[transcript] insert error:", insertErr.message);
    // Best-effort cleanup of the orphaned file.
    await supabase.storage.from(bucket).remove([storagePath]);
    return NextResponse.json({ error: "record_failed" }, { status: 500 });
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "transcript.upload",
    target: transcriptId,
    targetStudentId: user.id,
    detail: { filename: file.name.slice(0, 200), size: file.size, mime: file.type },
  });

  // Process synchronously so the review screen has results immediately.
  const outcome = await processTranscript(transcriptId);

  return NextResponse.json({
    id: transcriptId,
    processed: outcome.ok,
    rows: outcome.rows,
    warnings: outcome.warnings,
  });
}
