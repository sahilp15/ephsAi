import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Append-only audit logging for privileged and sensitive actions.
 *
 * Records who did what, to which student/record, and when. Detail must stay
 * non-sensitive: never log OAuth tokens, transcript file contents, raw private
 * storage paths, or credentials. Writes go through the service-role client so
 * the log cannot be tampered with under a caller's RLS scope, and a logging
 * failure never blocks the underlying action.
 */

export type AuditAction =
  | "auth.login"
  | "auth.provision_profile"
  | "auth.denied"
  | "transcript.upload"
  | "transcript.view"
  | "transcript.delete"
  | "transcript.confirm"
  | "transcript.match_change"
  | "academic_record.edit"
  | "academic_record.delete"
  | "graduation_requirements.edit"
  | "course_equivalency.edit"
  | "club.edit"
  | "club.delete"
  | "club.restore"
  | "course_override.edit"
  | "admin.grant"
  | "admin.revoke"
  | "admin.view_student";

export interface AuditInput {
  actorId: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  target?: string | null;
  targetStudentId?: string | null;
  detail?: Record<string, unknown>;
}

export async function logAudit(event: AuditInput): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return; // Auditing requires the service role; degrade quietly.
  try {
    await admin.from("audit_events").insert({
      actor_id: event.actorId,
      actor_email: event.actorEmail ?? null,
      action: event.action,
      target: event.target ?? null,
      target_student_id: event.targetStudentId ?? null,
      detail: event.detail ?? {},
    });
  } catch (err) {
    console.error(
      "[audit] failed to record event:",
      err instanceof Error ? err.message : err,
    );
  }
}
