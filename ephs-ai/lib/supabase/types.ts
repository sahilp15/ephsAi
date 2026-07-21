/**
 * Hand-authored database types for the tables the application queries.
 *
 * This is intentionally focused (not a full generated dump): it types the
 * columns the app reads and writes so queries are checked at compile time.
 * Columns present in the SQL migrations but unused here are simply not listed;
 * `select("*")` still returns them at runtime.
 */

export type AppRole = "student" | "counselor" | "admin";

export type ProfileRow = {
  user_id: string;
  role: AppRole;
  display_name: string;
  email: string | null;
  google_sub: string | null;
  avatar_url: string | null;
  preferred_first_name: string | null;
  current_school: string | null;
  counselor_name: string | null;
  student_type: "new" | "returning" | null;
  graduation_year: number | null;
  current_grade: number | null;
  interests: string[];
  career_ideas: string[];
  rigor: "standard" | "balanced" | "challenging";
  ap_interest: boolean;
  pathway_interests: string[];
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentOnboardingRow = {
  student_id: string;
  goals: string;
  college_career_interests: string[];
  favorite_subjects: string[];
  challenging_subjects: string[];
  program_interests: string[];
  schedule_preference: "rigorous" | "balanced" | "lighter";
  commitments: string[];
  post_grad_plan:
    | "four_year"
    | "two_year"
    | "technical"
    | "workforce"
    | "military"
    | "undecided"
    | null;
  step_completed: number;
  created_at: string;
  updated_at: string;
}

export type TranscriptStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "failed"
  | "confirmed";

export type TranscriptRow = {
  id: string;
  student_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: TranscriptStatus;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
  confirmed_at: string | null;
}

export type MatchConfidence = "high" | "possible" | "needs_review" | "none";

export type TranscriptExtractedRow = {
  id: string;
  transcript_id: string;
  row_index: number;
  raw_course_name: string;
  raw_course_code: string | null;
  school_year: string | null;
  grade_level: number | null;
  term: string | null;
  final_grade: string | null;
  credits_attempted: number | null;
  credits_earned: number | null;
  course_level: string | null;
  is_honors: boolean;
  is_ap: boolean;
  in_progress: boolean;
  is_repeat: boolean;
  is_incomplete: boolean;
  is_transfer: boolean;
  matched_course_id: string | null;
  match_confidence: MatchConfidence;
  match_method: string | null;
  confirmed: boolean;
  raw: Record<string, unknown>;
  created_at: string;
}

export type AcademicRecordType =
  | "completed"
  | "in_progress"
  | "transfer"
  | "manual"
  | "repeat_needed"
  | "unmatched";

export type AcademicRecordRow = {
  id: string;
  student_id: string;
  course_id: string | null;
  original_course_name: string | null;
  source: "transcript" | "manual";
  source_transcript_id: string | null;
  source_row_id: string | null;
  record_type: AcademicRecordType;
  grade_level: number | null;
  school_year: string | null;
  term: string | null;
  final_grade: string | null;
  credits_earned: number | null;
  is_honors: boolean;
  is_ap: boolean;
  is_transfer: boolean;
  confidence: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanEntryRow = {
  id: string;
  plan_id: string;
  course_id: string;
  grade_year: number;
  starting_term: number;
  occupied_terms: number;
  status: "planned" | "completed" | "dropped" | "considering";
  locked: boolean;
  source: "recommended" | "student" | "transcript";
  recommendation_reason: string | null;
  student_note: string | null;
  counselor_note: string | null;
}

export type AcademicPlanRow = {
  id: string;
  student_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type CourseEquivalencyRow = {
  id: string;
  source_name: string;
  course_id: string | null;
  is_transfer: boolean;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export type AdminAllowlistRow = {
  email: string;
  added_by: string | null;
  note: string | null;
  created_at: string;
}

export type AuditEventRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target: string | null;
  target_student_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export type ClubRow = {
  id: string;
  name: string;
  description: string;
  description_source: "official" | "general";
  category: string;
  advisor: string | null;
  student_leaders: string[];
  meeting_days: string[];
  meeting_time: string | null;
  meeting_frequency: string | null;
  location: string | null;
  grades: string[];
  membership_requirements: string | null;
  contact_email: string | null;
  join_instructions: string | null;
  website: string | null;
  registration_url: string | null;
  additional_notes: string | null;
  source_url: string;
  active: boolean;
  /** Soft-delete flag so an admin can remove a club without losing history. */
  deleted: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CourseOverrideRow = {
  course_id: string;
  active: boolean;
  /** null = use the guide's duration. */
  term_count: number | null;
  note: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      student_onboarding: Table<StudentOnboardingRow>;
      transcripts: Table<TranscriptRow>;
      transcript_jobs: Table<{
        id: string;
        transcript_id: string;
        provider: string;
        status: "pending" | "running" | "succeeded" | "failed";
        attempts: number;
        error: string | null;
        summary: Record<string, unknown>;
        started_at: string;
        finished_at: string | null;
      }>;
      transcript_extracted_rows: Table<TranscriptExtractedRow>;
      academic_records: Table<AcademicRecordRow>;
      plan_entries: Table<PlanEntryRow>;
      academic_plans: Table<AcademicPlanRow>;
      course_equivalencies: Table<CourseEquivalencyRow>;
      clubs: Table<ClubRow>;
      course_overrides: Table<CourseOverrideRow>;
      admin_allowlist: Table<AdminAllowlistRow>;
      audit_events: Table<AuditEventRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
