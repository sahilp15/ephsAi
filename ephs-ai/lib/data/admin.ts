import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AcademicRecordRow,
  AdminAllowlistRow,
  AuditEventRow,
  CourseEquivalencyRow,
  ProfileRow,
  TranscriptRow,
  StudentOnboardingRow,
} from "@/lib/supabase/types";

/**
 * Administrator data access. Every function here runs through the RLS-enforced
 * request client and only returns data because the caller's `profiles.role`
 * is `admin` (enforced by the `*_admin_read` / `*_admin_write` policies). Call
 * sites additionally gate with `requireAdmin`, so authorization is enforced on
 * both the application and database layers.
 */

export interface StudentSummary {
  userId: string;
  email: string | null;
  displayName: string;
  currentGrade: number | null;
  graduationYear: number | null;
  onboardingCompleted: boolean;
  studentType: "new" | "returning" | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function adminListStudents(search?: string): Promise<StudentSummary[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase
    .from("profiles")
    .select(
      "user_id, email, display_name, current_grade, graduation_year, onboarding_completed, student_type, last_login_at, created_at",
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search && search.trim()) {
    const q = search.trim().replace(/[%,]/g, "");
    query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  }
  const { data } = await query;
  return (data ?? []).map((r) => ({
    userId: r.user_id,
    email: r.email,
    displayName: r.display_name,
    currentGrade: r.current_grade,
    graduationYear: r.graduation_year,
    onboardingCompleted: r.onboarding_completed,
    studentType: r.student_type,
    lastLoginAt: r.last_login_at,
    createdAt: r.created_at,
  }));
}

export interface StudentDetail {
  profile: ProfileRow;
  onboarding: StudentOnboardingRow | null;
  transcripts: TranscriptRow[];
  records: AcademicRecordRow[];
}

export async function adminGetStudent(studentId: string): Promise<StudentDetail | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", studentId)
    .maybeSingle();
  if (!profile) return null;
  const [onboarding, transcripts, records] = await Promise.all([
    supabase.from("student_onboarding").select("*").eq("student_id", studentId).maybeSingle(),
    supabase.from("transcripts").select("*").eq("student_id", studentId).order("uploaded_at", { ascending: false }),
    supabase.from("academic_records").select("*").eq("student_id", studentId).order("grade_level", { ascending: true }),
  ]);
  return {
    profile: profile as ProfileRow,
    onboarding: (onboarding.data as StudentOnboardingRow | null) ?? null,
    transcripts: (transcripts.data as TranscriptRow[] | null) ?? [],
    records: (records.data as AcademicRecordRow[] | null) ?? [],
  };
}

export interface AdminStats {
  students: number;
  onboarded: number;
  transcriptsProcessed: number;
  transcriptsFailed: number;
  lowConfidenceRows: number;
}

export async function adminStats(): Promise<AdminStats> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { students: 0, onboarded: 0, transcriptsProcessed: 0, transcriptsFailed: 0, lowConfidenceRows: 0 };
  }
  const [students, onboarded, processed, failed, lowConf] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "student").eq("onboarding_completed", true),
    supabase.from("transcripts").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("transcripts").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("transcript_extracted_rows").select("id", { count: "exact", head: true }).in("match_confidence", ["needs_review", "none"]).eq("confirmed", false),
  ]);
  return {
    students: students.count ?? 0,
    onboarded: onboarded.count ?? 0,
    transcriptsProcessed: processed.count ?? 0,
    transcriptsFailed: failed.count ?? 0,
    lowConfidenceRows: lowConf.count ?? 0,
  };
}

export async function adminListEquivalencies(): Promise<CourseEquivalencyRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("course_equivalencies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as CourseEquivalencyRow[] | null) ?? [];
}

export async function adminListAllowlist(): Promise<AdminAllowlistRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("admin_allowlist")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as AdminAllowlistRow[] | null) ?? [];
}

export async function adminListAudit(limit = 100): Promise<AuditEventRow[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AuditEventRow[] | null) ?? [];
}
