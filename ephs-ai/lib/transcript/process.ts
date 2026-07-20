import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import { getExtractionProvider } from "./provider";
import { extractAndMatchTranscript } from "./extract";

export interface ProcessOutcome {
  ok: boolean;
  rows: number;
  warnings: string[];
  error?: string;
}

/**
 * Download a stored transcript, extract structured rows via the configured
 * provider, match each row against the EPHS catalog with a confidence level,
 * and persist the results. Runs with the service-role client (bypasses RLS)
 * because it reads the private file and writes rows on the student's behalf;
 * it is only ever invoked from an owner-verified server route. Idempotent:
 * re-processing replaces prior extracted rows.
 */
export async function processTranscript(transcriptId: string): Promise<ProcessOutcome> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, rows: 0, warnings: [], error: "Storage is not configured." };
  }
  const bucket = getEnv().TRANSCRIPT_BUCKET;
  const now = () => new Date().toISOString();

  const { data: transcript } = await admin
    .from("transcripts")
    .select("*")
    .eq("id", transcriptId)
    .maybeSingle();
  if (!transcript) return { ok: false, rows: 0, warnings: [], error: "Not found." };

  const provider = getExtractionProvider();
  const { data: job } = await admin
    .from("transcript_jobs")
    .insert({
      transcript_id: transcriptId,
      provider: provider.name,
      status: "running",
      attempts: 1,
    })
    .select("id")
    .maybeSingle();

  await admin.from("transcripts").update({ status: "processing" }).eq("id", transcriptId);

  try {
    const { data: file, error: dlErr } = await admin.storage
      .from(bucket)
      .download(transcript.storage_path);
    if (dlErr || !file) throw new Error("download_failed");

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await extractAndMatchTranscript(
      {
        bytes,
        mimeType: transcript.mime_type,
        filename: transcript.original_filename,
      },
      provider,
    );

    // Idempotency: clear any previous extraction for this transcript.
    await admin.from("transcript_extracted_rows").delete().eq("transcript_id", transcriptId);

    const rowsToInsert = result.rows.map((r) => ({
      transcript_id: transcriptId,
      row_index: r.rowIndex,
      raw_course_name: r.rawCourseName,
      raw_course_code: r.rawCourseCode,
      school_year: r.schoolYear,
      grade_level: r.gradeLevel,
      term: r.term,
      final_grade: r.finalGrade,
      credits_attempted: r.creditsAttempted,
      credits_earned: r.creditsEarned,
      course_level: r.courseLevel,
      is_honors: r.isHonors,
      is_ap: r.isAp,
      in_progress: r.inProgress,
      is_repeat: r.isRepeat,
      is_incomplete: r.isIncomplete,
      is_transfer: r.isTransfer,
      matched_course_id: r.matchedCourseId,
      match_confidence: r.matchConfidence,
      match_method: r.matchMethod,
      confirmed: false,
      raw: r.raw,
    }));

    if (rowsToInsert.length > 0) {
      await admin.from("transcript_extracted_rows").insert(rowsToInsert);
    }

    await admin
      .from("transcripts")
      .update({
        status: "processed",
        processed_at: now(),
        error_message: result.warnings[0] ?? null,
      })
      .eq("id", transcriptId);

    if (job) {
      await admin
        .from("transcript_jobs")
        .update({
          status: "succeeded",
          finished_at: now(),
          summary: { rows: rowsToInsert.length, warnings: result.warnings },
        })
        .eq("id", job.id);
    }

    return { ok: true, rows: rowsToInsert.length, warnings: result.warnings };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[transcript] processing failed:", message);
    await admin
      .from("transcripts")
      .update({
        status: "failed",
        error_message:
          "We couldn't process this transcript automatically. You can try another file or add courses manually.",
      })
      .eq("id", transcriptId);
    if (job) {
      await admin
        .from("transcript_jobs")
        .update({ status: "failed", finished_at: now(), error: message })
        .eq("id", job.id);
    }
    return { ok: false, rows: 0, warnings: [], error: "processing_failed" };
  }
}
