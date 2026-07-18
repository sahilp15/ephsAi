import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/auth/audit";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/transcript/[id]?mode=file|file_and_records
 *
 * Removes the private file (from storage, not just the DB reference) and the
 * transcript record. With `mode=file_and_records` it also removes the
 * academic history created from this transcript; otherwise confirmed history is
 * preserved. Owner-only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "student") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "unconfigured" }, { status: 503 });

  const mode = request.nextUrl.searchParams.get("mode") === "file_and_records"
    ? "file_and_records"
    : "file";

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, student_id, storage_path")
    .eq("id", params.id)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!transcript) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Remove the actual private file. Prefer the service role so the object is
  // guaranteed gone even if a storage policy edge case would block the user.
  const bucket = getEnv().TRANSCRIPT_BUCKET;
  const admin = createSupabaseAdminClient();
  const storageClient = admin ?? supabase;
  const { error: rmErr } = await storageClient.storage
    .from(bucket)
    .remove([transcript.storage_path]);
  if (rmErr) {
    console.error("[transcript] file removal error:", rmErr.message);
  }

  if (mode === "file_and_records") {
    await supabase
      .from("academic_records")
      .delete()
      .eq("student_id", user.id)
      .eq("source_transcript_id", params.id);
  } else {
    // Keep confirmed history but detach it from the deleted transcript.
    await supabase
      .from("academic_records")
      .update({ source_transcript_id: null })
      .eq("student_id", user.id)
      .eq("source_transcript_id", params.id);
  }

  // Deleting the transcript cascades its extracted rows and jobs.
  await supabase.from("transcripts").delete().eq("id", params.id).eq("student_id", user.id);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "transcript.delete",
    target: params.id,
    targetStudentId: user.id,
    detail: { mode },
  });

  return NextResponse.json({ ok: true });
}
