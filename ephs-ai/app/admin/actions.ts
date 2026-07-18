"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/auth/audit";
import { normalizeForMatch } from "@/lib/domain/transcript-match";
import { normalizeEmail } from "@/lib/auth/rules";

/** Create or update a course equivalency used by transcript matching. */
export async function upsertEquivalencyAction(input: {
  sourceName: string;
  courseId: string | null;
  isTransfer: boolean;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const sourceName = input.sourceName.trim();
  if (!sourceName) return { ok: false, error: "empty" };

  // Store the normalized name so the matcher's lookups align.
  const { error } = await supabase.from("course_equivalencies").upsert(
    {
      source_name: normalizeForMatch(sourceName),
      course_id: input.courseId,
      is_transfer: input.isTransfer,
      note: input.note ?? null,
      created_by: admin.id,
    },
    { onConflict: "source_name" },
  );
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "course_equivalency.edit",
    target: sourceName,
    detail: { courseId: input.courseId, isTransfer: input.isTransfer },
  });
  revalidatePath("/admin/mappings");
  return { ok: true };
}

export async function deleteEquivalencyAction(id: string): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("course_equivalencies").delete().eq("id", id);
  if (!error) {
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "course_equivalency.edit",
      target: id,
      detail: { deleted: true },
    });
    revalidatePath("/admin/mappings");
  }
  return { ok: !error };
}

/** Grant administrator access to an additional email (DB allowlist). */
export async function addAdminAction(
  email: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return { ok: false, error: "invalid_email" };

  const { error } = await supabase
    .from("admin_allowlist")
    .upsert({ email: normalized, added_by: admin.id, note: note ?? null }, { onConflict: "email" });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.grant",
    target: normalized,
  });
  revalidatePath("/admin/access");
  return { ok: true };
}

export async function removeAdminAction(email: string): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const normalized = normalizeEmail(email);
  const { error } = await supabase.from("admin_allowlist").delete().eq("email", normalized);
  if (!error) {
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "admin.revoke",
      target: normalized,
    });
    revalidatePath("/admin/access");
  }
  return { ok: !error };
}
