import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow, StudentOnboardingRow } from "@/lib/supabase/types";

/**
 * Onboarding data access. Reads/writes the student's own rows through the
 * request-scoped (RLS-enforced) client, so a student can only ever touch their
 * own profile + onboarding responses.
 */

export const onboardingSchema = z.object({
  preferredFirstName: z.string().trim().max(60).default(""),
  displayName: z.string().trim().max(120).default(""),
  currentGrade: z.coerce.number().int().min(9).max(12).default(9),
  graduationYear: z.coerce.number().int().min(2024).max(2035).default(2029),
  currentSchool: z.string().trim().max(120).default("Eden Prairie High School"),
  counselorName: z.string().trim().max(120).default(""),
  interests: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  careerIdeas: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  rigor: z.enum(["standard", "balanced", "challenging"]).default("balanced"),
  apInterest: z.boolean().default(false),
  pathwayIds: z.array(z.string().trim()).max(20).default([]),
  goals: z.string().trim().max(2000).default(""),
  collegeCareerInterests: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  favoriteSubjects: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  challengingSubjects: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  programInterests: z.array(z.string().trim()).max(20).default([]),
  schedulePreference: z.enum(["rigorous", "balanced", "lighter"]).default("balanced"),
  commitments: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  postGradPlan: z
    .enum(["four_year", "two_year", "technical", "workforce", "military", "undecided"])
    .nullable()
    .default(null),
  studentType: z.enum(["new", "returning"]).nullable().default(null),
});

export type OnboardingDraft = z.infer<typeof onboardingSchema>;

export function emptyDraft(defaults?: Partial<OnboardingDraft>): OnboardingDraft {
  return onboardingSchema.parse({ ...defaults });
}

/** Merge the persisted profile + onboarding rows into a single editable draft. */
export async function loadOnboardingDraft(userId: string): Promise<OnboardingDraft> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return emptyDraft();

  const [{ data: profileData }, { data: onboardingData }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "preferred_first_name, display_name, current_grade, graduation_year, current_school, counselor_name, interests, career_ideas, rigor, ap_interest, pathway_interests, student_type",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("student_onboarding").select("*").eq("student_id", userId).maybeSingle(),
  ]);

  const p = profileData as Partial<ProfileRow> | null;
  const o = onboardingData as StudentOnboardingRow | null;

  return emptyDraft({
    preferredFirstName: p?.preferred_first_name ?? "",
    displayName: p?.display_name ?? "",
    currentGrade: p?.current_grade ?? 9,
    graduationYear: p?.graduation_year ?? defaultGraduationYear(p?.current_grade ?? 9),
    currentSchool: p?.current_school ?? "Eden Prairie High School",
    counselorName: p?.counselor_name ?? "",
    interests: p?.interests ?? [],
    careerIdeas: p?.career_ideas ?? [],
    rigor: p?.rigor ?? "balanced",
    apInterest: p?.ap_interest ?? false,
    pathwayIds: p?.pathway_interests ?? [],
    studentType: p?.student_type ?? null,
    goals: o?.goals ?? "",
    collegeCareerInterests: o?.college_career_interests ?? [],
    favoriteSubjects: o?.favorite_subjects ?? [],
    challengingSubjects: o?.challenging_subjects ?? [],
    programInterests: o?.program_interests ?? [],
    schedulePreference: o?.schedule_preference ?? "balanced",
    commitments: o?.commitments ?? [],
    postGradPlan: o?.post_grad_plan ?? null,
  });
}

/**
 * Persist an onboarding draft. `complete` marks onboarding finished (used on
 * the final review step); otherwise this is an autosave that records progress
 * without flipping the completion flag.
 */
export async function saveOnboardingDraft(
  userId: string,
  draft: OnboardingDraft,
  opts: { complete?: boolean; step?: number } = {},
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const now = new Date().toISOString();

  const profileUpdate: Partial<ProfileRow> = {
    preferred_first_name: draft.preferredFirstName,
    display_name: draft.displayName || draft.preferredFirstName,
    current_grade: draft.currentGrade,
    graduation_year: draft.graduationYear,
    current_school: draft.currentSchool,
    counselor_name: draft.counselorName,
    interests: draft.interests,
    career_ideas: draft.careerIdeas,
    rigor: draft.rigor,
    ap_interest: draft.apInterest,
    pathway_interests: draft.pathwayIds,
    student_type: draft.studentType,
    updated_at: now,
  };
  if (opts.complete) profileUpdate.onboarding_completed = true;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("user_id", userId);
  if (profileErr) {
    console.error("[onboarding] profile save error:", profileErr.message);
    return { ok: false, error: "save_failed" };
  }

  const { error: onboardingErr } = await supabase.from("student_onboarding").upsert(
    {
      student_id: userId,
      goals: draft.goals,
      college_career_interests: draft.collegeCareerInterests,
      favorite_subjects: draft.favoriteSubjects,
      challenging_subjects: draft.challengingSubjects,
      program_interests: draft.programInterests,
      schedule_preference: draft.schedulePreference,
      commitments: draft.commitments,
      post_grad_plan: draft.postGradPlan,
      step_completed: opts.step ?? 0,
      updated_at: now,
    },
    { onConflict: "student_id" },
  );
  if (onboardingErr) {
    console.error("[onboarding] onboarding save error:", onboardingErr.message);
    return { ok: false, error: "save_failed" };
  }

  return { ok: true };
}

function defaultGraduationYear(grade: number): number {
  // Rough default: current calendar assumptions are avoided; derive from grade.
  const yearsLeft = 12 - grade;
  return 2027 + yearsLeft; // grade 12 → 2027 baseline; adjusted by student later
}
