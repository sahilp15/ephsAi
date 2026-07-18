"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { onboardingSchema, saveOnboardingDraft } from "@/lib/data/onboarding";

/** Autosave the in-progress draft without marking onboarding complete. */
export async function autosaveOnboarding(
  raw: unknown,
  step: number,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStudent();
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return saveOnboardingDraft(user.id, parsed.data, { step });
}

/** Finalize onboarding on the review step. */
export async function completeOnboarding(
  raw: unknown,
): Promise<{ ok: boolean; error?: string; studentType: "new" | "returning" | null }> {
  const user = await requireStudent();
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid", studentType: null };
  const res = await saveOnboardingDraft(user.id, parsed.data, { complete: true, step: 99 });
  revalidatePath("/dashboard");
  revalidatePath("/plan");
  return { ...res, studentType: parsed.data.studentType };
}
