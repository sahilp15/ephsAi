import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/auth/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rowSchema = z.object({
  rowId: z.string().uuid().nullish(),
  include: z.boolean().default(true),
  courseId: z.string().nullable(),
  originalCourseName: z.string().max(200),
  recordType: z.enum(["completed", "in_progress", "transfer", "repeat_needed", "unmatched"]),
  gradeLevel: z.number().int().min(6).max(12).nullable(),
  term: z.string().max(40).nullable(),
  finalGrade: z.string().max(10).nullable(),
  creditsEarned: z.number().min(0).max(20).nullable(),
  isHonors: z.boolean().default(false),
  isAp: z.boolean().default(false),
  isTransfer: z.boolean().default(false),
  confidence: z.string().max(20).default("confirmed"),
});

const bodySchema = z.object({ rows: z.array(rowSchema).max(300) });

/**
 * POST /api/transcript/[id]/confirm - the student's explicit confirmation.
 * Turns the reviewed rows into structured academic_records, marks the
 * transcript confirmed, and records the confirmation (and any match changes) in
 * the audit log. Idempotent: re-confirming replaces this transcript's records.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "student") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "unconfigured" }, { status: 503 });

  // Ownership check (RLS also enforces this).
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, student_id")
    .eq("id", params.id)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!transcript) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const included = parsed.data.rows.filter((r) => r.include);

  // Replace any prior records sourced from this transcript (idempotent re-confirm).
  await supabase
    .from("academic_records")
    .delete()
    .eq("student_id", user.id)
    .eq("source_transcript_id", params.id);

  if (included.length > 0) {
    const now = new Date().toISOString();
    const records = included.map((r) => {
      // A course with no chosen match becomes a transfer or unmatched record.
      let recordType = r.recordType;
      if (!r.courseId && recordType !== "unmatched") {
        recordType = r.isTransfer ? "transfer" : "unmatched";
      }
      return {
        student_id: user.id,
        course_id: r.courseId,
        original_course_name: r.originalCourseName,
        source: "transcript" as const,
        source_transcript_id: params.id,
        source_row_id: r.rowId ?? null,
        record_type: recordType,
        grade_level: r.gradeLevel,
        term: r.term,
        final_grade: r.finalGrade,
        credits_earned: r.creditsEarned,
        is_honors: r.isHonors,
        is_ap: r.isAp,
        is_transfer: r.isTransfer,
        confidence: r.confidence,
        updated_at: now,
      };
    });
    const { error } = await supabase.from("academic_records").insert(records);
    if (error) {
      console.error("[transcript] confirm insert error:", error.message);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    // Reflect the student's final choices back onto the extracted rows.
    for (const r of included) {
      if (!r.rowId) continue;
      await supabase
        .from("transcript_extracted_rows")
        .update({ confirmed: true, matched_course_id: r.courseId })
        .eq("id", r.rowId)
        .eq("transcript_id", params.id);
    }
  }

  await supabase
    .from("transcripts")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("student_id", user.id);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "transcript.confirm",
    target: params.id,
    targetStudentId: user.id,
    detail: { confirmed: included.length },
  });

  return NextResponse.json({ ok: true, records: included.length });
}
