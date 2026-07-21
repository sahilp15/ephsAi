import type { Club } from "./types";
import {
  expandQuery,
  fuzzyTokenMatch,
  normalizeText,
  tokenize,
  weekdaysIn,
} from "@/lib/search/fuzzy";

/**
 * Pure clubs search + filtering.
 *
 * Operates on a supplied club array (no I/O) so the same ranking powers both
 * the student Clubs page and the chatbot's club retrieval. Matching is
 * typo-tolerant and interest-aware (via the shared synonym map) so queries like
 * "buisness", "robot club", or "something related to medicine" resolve to the
 * right official records without inventing anything.
 */

export type ClubSort = "relevance" | "name" | "category";

export interface ClubFilters {
  q?: string;
  category?: string;
  grade?: string;
  meetingDay?: string;
  /** Only clubs that meet during the school day / after school (Tuesday focus). */
  afterSchool?: boolean;
  sort?: ClubSort;
  /** Include inactive clubs (admin views). Defaults to active-only. */
  includeInactive?: boolean;
}

interface ClubDoc {
  club: Club;
  nameTokens: string[];
  bodyTokens: string[];
}

function buildDoc(club: Club): ClubDoc {
  const body = [
    club.description,
    club.category,
    club.advisor ?? "",
    club.meetingDays.join(" "),
    club.location ?? "",
    club.additionalNotes ?? "",
    club.joinInstructions ?? "",
    club.membershipRequirements ?? "",
  ].join(" ");
  return {
    club,
    nameTokens: tokenize(club.name),
    bodyTokens: tokenize(`${club.name} ${body}`),
  };
}

function scoreDoc(doc: ClubDoc, terms: Array<{ term: string; weight: number }>): number {
  if (terms.length === 0) return 1;
  let score = 0;
  // A term (original or a related-interest synonym) contributes only when it
  // actually matches this club's name or body, so unrelated queries score 0.
  // Synonyms carry lower weight, so direct-name hits always outrank them.
  for (const { term, weight } of terms) {
    if (fuzzyTokenMatch(doc.nameTokens, term)) score += 6 * weight;
    else if (fuzzyTokenMatch(doc.bodyTokens, term)) score += 2 * weight;
  }
  return score;
}

export function searchClubs(clubs: Club[], filters: ClubFilters): Club[] {
  const {
    q,
    category,
    grade,
    meetingDay,
    afterSchool,
    sort = "relevance",
    includeInactive = false,
  } = filters;

  const terms = q ? expandQuery(q) : [];
  // If the query itself names a weekday, treat it as a meeting-day filter too.
  const dayFromQuery = q ? weekdaysIn(q)[0] : undefined;
  const dayFilter = meetingDay || dayFromQuery;

  const scored: Array<{ club: Club; score: number }> = [];
  for (const club of clubs) {
    if (!includeInactive && !club.active) continue;
    if (category && club.category !== category) continue;
    if (grade && !club.grades.includes(grade)) continue;
    if (dayFilter) {
      const days = club.meetingDays.map((d) => normalizeText(d));
      if (!days.some((d) => d.includes(normalizeText(dayFilter).slice(0, 3)))) {
        continue;
      }
    }
    if (afterSchool && club.meetingDays.length === 0) continue;

    const score = scoreDoc(buildDoc(club), terms);
    if (score === 0) continue;
    scored.push({ club, score });
  }

  if (sort === "name") {
    scored.sort((a, b) => a.club.name.localeCompare(b.club.name));
  } else if (sort === "category") {
    scored.sort(
      (a, b) =>
        a.club.category.localeCompare(b.club.category) ||
        a.club.name.localeCompare(b.club.name),
    );
  } else {
    scored.sort(
      (a, b) => b.score - a.score || a.club.name.localeCompare(b.club.name),
    );
  }
  return scored.map((s) => s.club);
}

/** Distinct meeting days present in the dataset (for filter UI). */
export function meetingDaysOf(clubs: Club[]): string[] {
  const set = new Set<string>();
  for (const c of clubs) for (const d of c.meetingDays) set.add(d);
  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return Array.from(set).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b),
  );
}
