import "server-only";
import {
  normalizeForMatch,
  type CatalogIndexEntry,
} from "@/lib/domain/transcript-match";
import { getCourses } from "./store";

/**
 * Build (once per process) the normalized-title index the transcript matcher
 * uses. Every canonical title, raw title seen in the guide, and per-appearance
 * title is normalized so renamed / older / semester-variant titles still match.
 */
let cache: CatalogIndexEntry[] | null = null;

export function getCatalogMatchIndex(): CatalogIndexEntry[] {
  if (cache) return cache;
  cache = getCourses().map((c) => {
    const names = new Set<string>([
      c.title,
      ...c.raw_titles_seen,
      ...c.source_appearances.map((a) => a.title),
    ]);
    const normalizedTitles = Array.from(
      new Set(
        Array.from(names)
          .map((n) => normalizeForMatch(n))
          .filter((n) => n.length > 0),
      ),
    );
    return {
      id: c.id,
      title: c.title,
      normalizedTitles,
      ap: c.flags.ap,
      honors: c.flags.honors,
    };
  });
  return cache;
}
