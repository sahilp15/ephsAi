import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlanEntryRow } from "@/lib/supabase/types";
import {
  projectHistory,
  historyToPlanEntries,
  type AcademicRecordInput,
} from "@/lib/domain/academic-history";
import { listAcademicRecords } from "./academic";

/**
 * Owner-scoped access to the student's four-year plan and the derived planner
 * state (confirmed history + future plan entries). All writes run through the
 * RLS-enforced client.
 */

export interface FuturePlanEntry {
  id: string;
  courseId: string;
  gradeYear: number;
  startTerm: number;
  termSpan: number;
  status: "planned" | "completed" | "dropped" | "considering";
  locked: boolean;
  source: "recommended" | "student" | "transcript";
  recommendationReason: string | null;
}

export interface PlannerState {
  planId: string | null;
  future: FuturePlanEntry[];
  history: ReturnType<typeof historyToPlanEntries>;
  projection: ReturnType<typeof projectHistory>;
}

function toRecordInput(r: {
  id: string;
  course_id: string | null;
  original_course_name: string | null;
  record_type: string;
  grade_level: number | null;
  term: string | null;
  credits_earned: number | null;
  is_transfer: boolean;
}): AcademicRecordInput {
  return {
    id: r.id,
    courseId: r.course_id,
    originalCourseName: r.original_course_name,
    recordType: r.record_type as AcademicRecordInput["recordType"],
    gradeLevel: r.grade_level,
    term: r.term,
    creditsEarned: r.credits_earned,
    isTransfer: r.is_transfer,
  };
}

/** Ensure a plan row exists for the student and return its id. */
export async function getOrCreatePlan(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data: existing } = await supabase
    .from("academic_plans")
    .select("id")
    .eq("student_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("academic_plans")
    .insert({ student_id: userId, name: "My four-year plan" })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[plan] create error:", error.message);
    return null;
  }
  return created?.id ?? null;
}

/** Load the full planner state: history-derived data + future plan entries. */
export async function loadPlannerState(userId: string): Promise<PlannerState> {
  const supabase = createSupabaseServerClient();
  const records = await listAcademicRecords(userId);
  const recordInputs = records.map(toRecordInput);
  const projection = projectHistory(recordInputs);
  const history = historyToPlanEntries(recordInputs);

  if (!supabase) {
    return { planId: null, future: [], history, projection };
  }

  const planId = await getOrCreatePlan(userId);
  let future: FuturePlanEntry[] = [];
  if (planId) {
    const { data } = await supabase
      .from("plan_entries")
      .select("*")
      .eq("plan_id", planId);
    future = (data as PlanEntryRow[] | null ?? []).map((e) => ({
      id: e.id,
      courseId: e.course_id,
      gradeYear: e.grade_year,
      startTerm: e.starting_term,
      termSpan: e.occupied_terms,
      status: e.status,
      locked: e.locked,
      source: e.source,
      recommendationReason: e.recommendation_reason,
    }));
  }

  return { planId, future, history, projection };
}

export interface AddPlanEntryInput {
  courseId: string;
  gradeYear: number;
  startTerm: number;
  termSpan: number;
  status?: FuturePlanEntry["status"];
  source?: FuturePlanEntry["source"];
  recommendationReason?: string | null;
  locked?: boolean;
}

export async function addPlanEntry(
  userId: string,
  input: AddPlanEntryInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const planId = await getOrCreatePlan(userId);
  if (!planId) return { ok: false, error: "no_plan" };

  // Prevent duplicate planning of the same course (unless repeating is intended).
  const { data: dupe } = await supabase
    .from("plan_entries")
    .select("id")
    .eq("plan_id", planId)
    .eq("course_id", input.courseId)
    .maybeSingle();
  if (dupe) return { ok: false, error: "duplicate" };

  const { data, error } = await supabase
    .from("plan_entries")
    .insert({
      plan_id: planId,
      course_id: input.courseId,
      grade_year: input.gradeYear,
      starting_term: input.startTerm,
      occupied_terms: input.termSpan,
      status: input.status ?? "planned",
      source: input.source ?? "student",
      recommendation_reason: input.recommendationReason ?? null,
      locked: input.locked ?? false,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  await touchPlan(userId, planId);
  return { ok: true, id: data?.id };
}

export async function updatePlanEntry(
  userId: string,
  entryId: string,
  patch: Partial<Pick<PlanEntryRow, "grade_year" | "starting_term" | "occupied_terms" | "status" | "locked">>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  // RLS ensures the entry belongs to a plan owned by this user.
  const { error } = await supabase.from("plan_entries").update(patch).eq("id", entryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removePlanEntry(
  userId: string,
  entryId: string,
): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("plan_entries").delete().eq("id", entryId);
  return { ok: !error };
}

async function touchPlan(userId: string, planId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return;
  await supabase
    .from("academic_plans")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("student_id", userId);
}
