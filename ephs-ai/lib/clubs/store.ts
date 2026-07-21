import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClubRow } from "@/lib/supabase/types";
import { getSeedClubs } from "./data";
import type { Club } from "./types";

/**
 * Clubs store — the single read path used by the student Clubs page, the
 * chatbot retrieval, and the admin views.
 *
 * Data = the official-grounded seed (`data/ephs-clubs.json`) with an optional
 * administrator overlay from the Supabase `clubs` table layered on top. This is
 * the same pattern the catalog uses (static dataset + DB import) and means:
 *   - With no database configured, the seed is served read-only.
 *   - With Supabase configured, admin edits/additions/removals apply instantly
 *     everywhere (page, search, chatbot) with no code deploy.
 */

function rowToClub(r: ClubRow): Club {
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
 * Load admin overrides. Returns null when Supabase is unconfigured OR the
 * `clubs` table has not been migrated yet, so the app always falls back to the
 * seed instead of erroring.
 */
async function loadOverrides(): Promise<{
  upserts: Map<string, Club>;
  deletions: Set<string>;
} | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("clubs").select("*").limit(2000);
  if (error || !data) return null;
  const upserts = new Map<string, Club>();
  const deletions = new Set<string>();
  for (const row of data as ClubRow[]) {
    if (row.deleted) deletions.add(row.id);
    else upserts.set(row.id, rowToClub(row));
  }
  return { upserts, deletions };
}

/** All clubs, seed merged with the admin overlay. Includes inactive by default. */
export async function getAllClubs(): Promise<Club[]> {
  const seed = getSeedClubs();
  const overrides = await loadOverrides();
  if (!overrides) return seed;

  const byId = new Map<string, Club>();
  for (const c of seed) {
    if (!overrides.deletions.has(c.id)) byId.set(c.id, c);
  }
  for (const [id, club] of overrides.upserts) byId.set(id, club);
  return Array.from(byId.values());
}

/** Active clubs only — what students should see. */
export async function getActiveClubs(): Promise<Club[]> {
  return (await getAllClubs()).filter((c) => c.active);
}

export async function getClubById(id: string): Promise<Club | undefined> {
  return (await getAllClubs()).find((c) => c.id === id);
}

/** Whether administrator persistence is available in this environment. */
export function clubsPersistenceAvailable(): boolean {
  return createSupabaseServerClient() !== null;
}
