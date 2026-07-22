"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/auth/audit";
import { normalizeForMatch } from "@/lib/domain/transcript-match";
import { normalizeEmail } from "@/lib/auth/rules";
import { clubSlug, getSeedClubs } from "@/lib/clubs/data";
import type { ClubInput } from "@/lib/clubs/types";
import type { ClubRow } from "@/lib/supabase/types";
import { getCourseById } from "@/lib/catalog/store";

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

// ---------------------------------------------------------------------------
// Clubs (full CRUD). Writes go to the Supabase `clubs` overlay, which
// `lib/clubs/store.ts` merges onto the seed so the student page and chatbot
// reflect edits instantly. Deletes are soft (set `deleted`).
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function nullableStr(v: unknown): string | null {
  const s = trimStr(v);
  return s === "" ? null : s;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = trimStr(item);
    if (s !== "") out.push(s);
  }
  return out;
}

function isValidUrl(v: string): boolean {
  return /^https?:\/\//i.test(v);
}

/** Create or update a club in the admin overlay. */
export async function upsertClubAction(
  input: ClubInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const name = trimStr(input.name);
  if (!name) return { ok: false, error: "name_required" };

  const contactEmail = nullableStr(input.contactEmail);
  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    return { ok: false, error: "invalid_email" };
  }
  const website = nullableStr(input.website);
  if (website && !isValidUrl(website)) return { ok: false, error: "invalid_website" };
  const registrationUrl = nullableStr(input.registrationUrl);
  if (registrationUrl && !isValidUrl(registrationUrl)) {
    return { ok: false, error: "invalid_registration_url" };
  }

  // Resolve the id. Editing keeps the immutable id; creating derives a unique
  // slug and blocks true duplicates (same slug as an existing non-deleted club).
  let id = trimStr(input.id);
  if (!id) {
    const seed = getSeedClubs();
    const { data } = await supabase.from("clubs").select("id, deleted").limit(2000);
    const overlay = (data as Pick<ClubRow, "id" | "deleted">[] | null) ?? [];
    const deletedIds = new Set(overlay.filter((r) => r.deleted).map((r) => r.id));
    const nonDeleted = new Set<string>();
    for (const c of seed) if (!deletedIds.has(c.id)) nonDeleted.add(c.id);
    for (const r of overlay) if (!r.deleted) nonDeleted.add(r.id);
    const allIds = new Set<string>([...seed.map((c) => c.id), ...overlay.map((r) => r.id)]);

    const base = clubSlug(name);
    if (!base) return { ok: false, error: "invalid_name" };
    if (nonDeleted.has(base)) return { ok: false, error: "duplicate" };
    let candidate = base;
    let n = 2;
    while (allIds.has(candidate)) candidate = `${base}-${n++}`;
    id = candidate;
  }

  const descriptionSource: "official" | "general" =
    input.descriptionSource === "official" ? "official" : "general";

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("clubs").upsert(
    {
      id,
      name,
      description: trimStr(input.description),
      description_source: descriptionSource,
      category: trimStr(input.category),
      advisor: nullableStr(input.advisor),
      student_leaders: stringArray(input.studentLeaders),
      meeting_days: stringArray(input.meetingDays),
      meeting_time: nullableStr(input.meetingTime),
      meeting_frequency: nullableStr(input.meetingFrequency),
      location: nullableStr(input.location),
      grades: stringArray(input.grades),
      membership_requirements: nullableStr(input.membershipRequirements),
      contact_email: contactEmail,
      join_instructions: nullableStr(input.joinInstructions),
      website,
      registration_url: registrationUrl,
      additional_notes: nullableStr(input.additionalNotes),
      source_url: trimStr(input.sourceUrl),
      active: input.active !== false,
      deleted: false,
      updated_by: admin.id,
      updated_at: nowIso,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "club.edit",
    target: id,
    detail: { name },
  });
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { ok: true, id };
}

/** Toggle a club's active flag (students only see active clubs). */
export async function setClubActiveAction(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const clubId = trimStr(id);
  if (!clubId) return { ok: false, error: "missing_id" };

  // A club may exist only in the seed; upsert so the overlay carries the flag.
  const seedClub = getSeedClubs().find((c) => c.id === clubId);
  if (!seedClub) {
    const { data } = await supabase.from("clubs").select("id").eq("id", clubId).maybeSingle();
    if (!data) return { ok: false, error: "not_found" };
  }

  const nowIso = new Date().toISOString();
  const { error } = seedClub
    ? await supabase.from("clubs").upsert(
        {
          ...clubToRowPayload(seedClub),
          active,
          deleted: false,
          updated_by: admin.id,
          updated_at: nowIso,
        },
        { onConflict: "id" },
      )
    : await supabase
        .from("clubs")
        .update({ active, updated_by: admin.id, updated_at: nowIso })
        .eq("id", clubId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "club.edit",
    target: clubId,
    detail: { active },
  });
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { ok: true };
}

/** Soft-delete a club (hidden from students; restorable by an admin). */
export async function deleteClubAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const clubId = trimStr(id);
  if (!clubId) return { ok: false, error: "missing_id" };

  const seedClub = getSeedClubs().find((c) => c.id === clubId);
  const nowIso = new Date().toISOString();
  const { error } = seedClub
    ? await supabase.from("clubs").upsert(
        {
          ...clubToRowPayload(seedClub),
          deleted: true,
          updated_by: admin.id,
          updated_at: nowIso,
        },
        { onConflict: "id" },
      )
    : await supabase
        .from("clubs")
        .update({ deleted: true, updated_by: admin.id, updated_at: nowIso })
        .eq("id", clubId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "club.delete",
    target: clubId,
  });
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { ok: true };
}

/** Restore a soft-deleted club. */
export async function restoreClubAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const clubId = trimStr(id);
  if (!clubId) return { ok: false, error: "missing_id" };

  const { error } = await supabase
    .from("clubs")
    .update({ deleted: false, updated_by: admin.id, updated_at: new Date().toISOString() })
    .eq("id", clubId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "club.restore",
    target: clubId,
  });
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { ok: true };
}

/**
 * Build the snake_case overlay payload for a seed club so activate/deactivate
 * or delete on a seed-only club materializes a full overlay row.
 */
function clubToRowPayload(club: {
  id: string;
  name: string;
  description: string;
  descriptionSource: "official" | "general";
  category: string;
  advisor: string | null;
  studentLeaders: string[];
  meetingDays: string[];
  meetingTime: string | null;
  meetingFrequency: string | null;
  location: string | null;
  grades: string[];
  membershipRequirements: string | null;
  contactEmail: string | null;
  joinInstructions: string | null;
  website: string | null;
  registrationUrl: string | null;
  additionalNotes: string | null;
  sourceUrl: string;
  active: boolean;
}) {
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    description_source: club.descriptionSource,
    category: club.category,
    advisor: club.advisor,
    student_leaders: club.studentLeaders,
    meeting_days: club.meetingDays,
    meeting_time: club.meetingTime,
    meeting_frequency: club.meetingFrequency,
    location: club.location,
    grades: club.grades,
    membership_requirements: club.membershipRequirements,
    contact_email: club.contactEmail,
    join_instructions: club.joinInstructions,
    website: club.website,
    registration_url: club.registrationUrl,
    additional_notes: club.additionalNotes,
    source_url: club.sourceUrl,
    active: club.active,
  };
}

// ---------------------------------------------------------------------------
// Course overrides. Deactivate a course or override its duration without
// editing the extracted catalog dataset.
// ---------------------------------------------------------------------------

/** Activate or deactivate a catalog course for students. */
export async function setCourseActiveAction(
  courseId: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const id = trimStr(courseId);
  if (!id || !getCourseById(id)) return { ok: false, error: "not_found" };

  const { error } = await supabase.from("course_overrides").upsert(
    {
      course_id: id,
      active,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id" },
  );
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "course_override.edit",
    target: id,
    detail: { active },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true };
}

/** Override (or clear) a course's duration in terms. */
export async function setCourseDurationAction(
  courseId: string,
  termCount: number | null,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const id = trimStr(courseId);
  if (!id || !getCourseById(id)) return { ok: false, error: "not_found" };

  let terms: number | null = null;
  if (termCount !== null && termCount !== undefined) {
    if (!Number.isInteger(termCount) || termCount < 1 || termCount > 12) {
      return { ok: false, error: "invalid_term_count" };
    }
    terms = termCount;
  }

  const { error } = await supabase.from("course_overrides").upsert(
    {
      course_id: id,
      term_count: terms,
      note: note ? trimStr(note) || null : null,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id" },
  );
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "course_override.edit",
    target: id,
    detail: { termCount: terms },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true };
}
