import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AcademicRecordRow,
  TranscriptExtractedRow,
  TranscriptRow,
} from "@/lib/supabase/types";

/**
 * Owner-scoped reads/writes for a student's transcripts and confirmed academic
 * records. All queries run through the RLS-enforced request client, so a
 * student can only ever see or change their own history.
 */

export async function listAcademicRecords(userId: string): Promise<AcademicRecordRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("academic_records")
    .select("*")
    .eq("student_id", userId)
    .order("grade_level", { ascending: true });
  return (data as AcademicRecordRow[] | null) ?? [];
}

export async function listTranscripts(userId: string): Promise<TranscriptRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("transcripts")
    .select("*")
    .eq("student_id", userId)
    .order("uploaded_at", { ascending: false });
  return (data as TranscriptRow[] | null) ?? [];
}

export async function getTranscriptForStudent(
  userId: string,
  transcriptId: string,
): Promise<{ transcript: TranscriptRow; rows: TranscriptExtractedRow[] } | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", transcriptId)
    .eq("student_id", userId)
    .maybeSingle();
  if (!transcript) return null;
  const { data: rows } = await supabase
    .from("transcript_extracted_rows")
    .select("*")
    .eq("transcript_id", transcriptId)
    .order("row_index", { ascending: true });
  return {
    transcript: transcript as TranscriptRow,
    rows: (rows as TranscriptExtractedRow[] | null) ?? [],
  };
}

export interface ManualRecordInput {
  courseId: string | null;
  originalCourseName: string | null;
  recordType: AcademicRecordRow["record_type"];
  gradeLevel: number | null;
  term: string | null;
  finalGrade: string | null;
  creditsEarned: number | null;
  isHonors?: boolean;
  isAp?: boolean;
  isTransfer?: boolean;
}

export async function addManualRecord(
  userId: string,
  input: ManualRecordInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const { error } = await supabase.from("academic_records").insert({
    student_id: userId,
    course_id: input.courseId,
    original_course_name: input.originalCourseName,
    source: "manual",
    record_type: input.recordType,
    grade_level: input.gradeLevel,
    term: input.term,
    final_grade: input.finalGrade,
    credits_earned: input.creditsEarned,
    is_honors: Boolean(input.isHonors),
    is_ap: Boolean(input.isAp),
    is_transfer: Boolean(input.isTransfer),
    confidence: "manual",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAcademicRecord(
  userId: string,
  recordId: string,
): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("academic_records")
    .delete()
    .eq("id", recordId)
    .eq("student_id", userId);
  return { ok: !error };
}
