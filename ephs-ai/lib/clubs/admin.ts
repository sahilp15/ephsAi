import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClubRow } from "@/lib/supabase/types";
import { getSeedClubs } from "./data";
import type { Club } from "./types";

/**
 * Administrator-facing clubs data access.
 *
 * The student-facing read path (`lib/clubs/store.ts`) intentionally hides
 * soft-deleted clubs. The admin views need the full picture: the merged seed +
 * overlay for editing, plus the set of soft-deleted ids so the UI can offer a
 * "restore" action. When Supabase is unconfigured the seed is returned
 * read-only (no overlay, nothing deleted).
 */

/** Map a Supabase `clubs` row to the domain `Club` shape (snake_case → camelCase). */
export function rowToClub(r: ClubRow): Club {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    descriptionSource: r.description_source,
    category: r.category,
    advisor: r.advisor,
    studentLeaders: r.student_leaders ?? [],
    meetingDays: r.meeting_days ?? [],
    meetingTime: r.meeting_time,
    meetingFrequency: r.meeting_frequency,
    location: r.location,
    grades: r.grades ?? [],
    membershipRequirements: r.membership_requirements,
    contactEmail: r.contact_email,
    joinInstructions: r.join_instructions,
    website: r.website,
    registrationUrl: r.registration_url,
    additionalNotes: r.additional_notes,
    sourceUrl: r.source_url,
    active: r.active,
  };
}

/**
 * Map a domain `Club` to a Supabase `clubs` row payload (camelCase → snake_case).
 * `id`, `updated_by`, `deleted`, and timestamps are set by the caller.
 */
export function clubToRow(club: Club): Omit<ClubRow, "updated_by" | "deleted" | "created_at" | "updated_at"> {
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

export interface AdminClubsView {
  /** Merged, non-deleted clubs (seed + overlay). */
  clubs: Club[];
  /** Soft-deleted clubs (seed or overlay), for the "restore" affordance. */
  deletedClubs: Club[];
  /** Whether administrator persistence is available in this environment. */
  persistence: boolean;
}

async function loadOverlay(): Promise<{
  upserts: Map<string, Club>;
  deletedRows: Map<string, Club>;
} | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clubs").select("*").limit(2000);
  if (error || !data) return null;
  const upserts = new Map<string, Club>();
  const deletedRows = new Map<string, Club>();
  for (const row of data as ClubRow[]) {
    if (row.deleted) deletedRows.set(row.id, rowToClub(row));
    else upserts.set(row.id, rowToClub(row));
  }
  return { upserts, deletedRows };
}

/**
 * Full admin view of clubs: the merged non-deleted list plus the soft-deleted
 * clubs (with names) so the UI can offer restore. When unconfigured, returns
 * the seed read-only with nothing deleted.
 */
export async function adminListClubs(): Promise<AdminClubsView> {
  const seed = getSeedClubs();
  const overlay = await loadOverlay();
  if (!overlay) {
    return { clubs: seed, deletedClubs: [], persistence: false };
  }

  const byId = new Map<string, Club>();
  for (const c of seed) {
    if (!overlay.deletedRows.has(c.id)) byId.set(c.id, c);
  }
  for (const [id, club] of overlay.upserts) byId.set(id, club);

  // A deleted seed club has no overlay body → fall back to the seed record.
  const seedById = new Map(seed.map((c) => [c.id, c]));
  const deletedClubs: Club[] = [];
  for (const [id, club] of overlay.deletedRows) {
    deletedClubs.push(seedById.get(id) ?? club);
  }

  return {
    clubs: Array.from(byId.values()),
    deletedClubs,
    persistence: true,
  };
}

/** The merged club for one id (includes inactive; excludes soft-deleted). */
export async function adminGetClub(id: string): Promise<Club | undefined> {
  const view = await adminListClubs();
  return view.clubs.find((c) => c.id === id);
}
