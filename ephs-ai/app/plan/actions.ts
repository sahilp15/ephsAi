"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import {
  addPlanEntry,
  removePlanEntry,
  updatePlanEntry,
  type AddPlanEntryInput,
} from "@/lib/data/plan";

export async function addPlanEntryAction(input: AddPlanEntryInput) {
  const user = await requireStudent();
  const res = await addPlanEntry(user.id, input);
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return res;
}

export async function movePlanEntryAction(
  entryId: string,
  gradeYear: number,
  startTerm: number,
) {
  const user = await requireStudent();
  const res = await updatePlanEntry(user.id, entryId, {
    grade_year: gradeYear,
    starting_term: startTerm,
  });
  revalidatePath("/plan");
  return res;
}

export async function setPlanEntryStatusAction(
  entryId: string,
  status: "planned" | "considering" | "completed" | "dropped",
) {
  const user = await requireStudent();
  const res = await updatePlanEntry(user.id, entryId, { status });
  revalidatePath("/plan");
  return res;
}

export async function setPlanEntryLockAction(entryId: string, locked: boolean) {
  const user = await requireStudent();
  const res = await updatePlanEntry(user.id, entryId, { locked });
  revalidatePath("/plan");
  return res;
}

export async function removePlanEntryAction(entryId: string) {
  const user = await requireStudent();
  const res = await removePlanEntry(user.id, entryId);
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return res;
}
