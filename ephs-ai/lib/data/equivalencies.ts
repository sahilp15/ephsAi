import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeForMatch, type EquivalencyEntry } from "@/lib/domain/transcript-match";

/**
 * Load admin-managed course equivalencies as a normalized-name → mapping map
 * for the matcher. Public-read (catalog-adjacent), so the request-scoped
 * client is sufficient. Returns an empty map when Supabase is unconfigured.
 */
export async function getEquivalencyMap(): Promise<Map<string, EquivalencyEntry>> {
  const supabase = createSupabaseServerClient();
  const map = new Map<string, EquivalencyEntry>();
  if (!supabase) return map;
  const { data } = await supabase
    .from("course_equivalencies")
    .select("source_name, course_id, is_transfer");
  for (const row of data ?? []) {
    map.set(normalizeForMatch(row.source_name), {
      courseId: row.course_id,
      isTransfer: row.is_transfer,
    });
  }
  return map;
}
