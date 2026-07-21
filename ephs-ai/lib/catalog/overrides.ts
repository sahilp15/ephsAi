import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CourseOverrideRow } from "@/lib/supabase/types";

/**
 * Administrator course overrides.
 *
 * The authoritative catalog (`lib/catalog/store.ts`) is read-only extracted
 * data. This overlay lets an admin deactivate a course (hide it from students)
 * or override its duration (`term_count`) without editing the dataset. When
 * Supabase is unconfigured the maps are empty, so the full catalog is served.
 */

export interface CourseOverride {
  active: boolean;
  termCount: number | null;
  note: string | null;
}

/** All course overrides keyed by course id. Empty when unconfigured. */
export async function adminListCourseOverrides(): Promise<Map<string, CourseOverride>> {
  const result = new Map<string, CourseOverride>();
  const supabase = createSupabaseServerClient();
  if (!supabase) return result;
  const { data, error } = await supabase
    .from("course_overrides")
    .select("*")
    .limit(2000);
  if (error || !data) return result;
  for (const row of data as CourseOverrideRow[]) {
    result.set(row.course_id, {
      active: row.active,
      termCount: row.term_count,
      note: row.note,
    });
  }
  return result;
}

/** Ids of courses an admin has deactivated. Empty when unconfigured. */
export async function getDeactivatedCourseIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const overrides = await adminListCourseOverrides();
  for (const [id, o] of overrides) {
    if (!o.active) ids.add(id);
  }
  return ids;
}
