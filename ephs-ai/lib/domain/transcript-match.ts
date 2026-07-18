/**
 * Deterministic transcript-course → EPHS catalog matcher.
 *
 * Pure and dependency-free so it can be unit tested and run on the server
 * without I/O. Given a course extracted from a transcript and an index of the
 * official catalog (plus optional admin-managed equivalencies), it proposes a
 * catalog match and an honest confidence level. It never silently forces an
 * uncertain match: low-confidence and transfer courses stay identifiable.
 */

export type MatchConfidence = "high" | "possible" | "needs_review" | "none";

export interface MatchCandidate {
  name: string;
  code?: string | null;
  isHonors?: boolean;
  isAp?: boolean;
  isTransfer?: boolean;
}

export interface CatalogIndexEntry {
  id: string;
  title: string;
  /** Every known normalized title/alias for this course. */
  normalizedTitles: string[];
  ap: boolean;
  honors: boolean;
}

export interface EquivalencyEntry {
  courseId: string | null;
  isTransfer: boolean;
}

export interface MatchContext {
  entries: CatalogIndexEntry[];
  /** normalized source name → equivalency mapping (admin-managed). */
  equivalencies?: Map<string, EquivalencyEntry>;
}

export interface MatchResult {
  courseId: string | null;
  confidence: MatchConfidence;
  method: string;
  /** Alternative catalog ids a reviewer might pick instead (best first). */
  alternatives: string[];
}

const STRIP_TOKENS = new Set([
  "ap",
  "advanced",
  "placement",
  "honors",
  "honor",
  "cis",
  "college",
  "in",
  "the",
  "schools",
  "school",
  "a",
  "b",
  "and",
  "&",
  "part",
  "sem",
  "semester",
  "trimester",
  "term",
  "full",
  "year",
  "yr",
]);

/** Normalize a course name for matching: lowercase, strip adornments + noise. */
export function normalizeForMatch(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bap\b/g, " ")
    .replace(/\ba\s*&\s*b\b/g, " ")
    .replace(/\ba\/b\b/g, " ")
    .replace(/\((.*?)\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Roman-numeral / arabic level canonicalization so "II" and "2" compare equal. */
const ROMAN: Record<string, string> = {
  i: "1",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
};

function tokenize(normalized: string): string[] {
  return normalized
    .split(" ")
    .map((t) => ROMAN[t] ?? t)
    .filter((t) => t.length > 0 && !STRIP_TOKENS.has(t));
}

/** Jaccard similarity over token sets, in [0,1]. */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Combined similarity of two normalized names in [0,1]. */
export function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const j = jaccard(ta, tb);
  // Bonus when one token list fully contains the other (renamed/expanded titles).
  const setA = new Set(ta);
  const setB = new Set(tb);
  const contained =
    [...setA].every((t) => setB.has(t)) || [...setB].every((t) => setA.has(t));
  return contained ? Math.min(1, j + 0.15) : j;
}

/**
 * Match a transcript course against the catalog. Returns the proposed match
 * with a confidence level; callers must surface `needs_review`/`none` for
 * explicit student confirmation and never treat them as settled.
 */
export function matchTranscriptCourse(
  candidate: MatchCandidate,
  ctx: MatchContext,
): MatchResult {
  const rawName = candidate.name?.trim() ?? "";
  if (!rawName) {
    return { courseId: null, confidence: "none", method: "empty", alternatives: [] };
  }
  const normalized = normalizeForMatch(rawName);

  // 1. Admin-managed equivalency (highest authority).
  const equiv = ctx.equivalencies?.get(normalized);
  if (equiv) {
    if (equiv.courseId) {
      return {
        courseId: equiv.courseId,
        confidence: "high",
        method: "equivalency",
        alternatives: [],
      };
    }
    // Explicitly recorded as a transfer / no-EPHS-equivalent.
    return { courseId: null, confidence: "none", method: "equivalency_transfer", alternatives: [] };
  }

  // 2. Exact normalized-title match.
  const exact = ctx.entries.filter((e) => e.normalizedTitles.includes(normalized));
  if (exact.length === 1) {
    return {
      courseId: exact[0]!.id,
      confidence: "high",
      method: "exact_title",
      alternatives: [],
    };
  }
  if (exact.length > 1) {
    // Ambiguous exact match — disambiguate by AP/Honors flags where possible.
    const refined = disambiguateByFlags(exact, candidate);
    return {
      courseId: refined.id,
      confidence: refined.confident ? "high" : "possible",
      method: "exact_title_ambiguous",
      alternatives: exact.map((e) => e.id).filter((id) => id !== refined.id),
    };
  }

  // 3. Fuzzy similarity against all catalog titles.
  let best: { id: string; score: number } | null = null;
  const scored: { id: string; score: number }[] = [];
  for (const entry of ctx.entries) {
    let entryScore = 0;
    for (const title of entry.normalizedTitles) {
      const s = nameSimilarity(normalized, title);
      if (s > entryScore) entryScore = s;
    }
    if (entryScore > 0) scored.push({ id: entry.id, score: entryScore });
    if (!best || entryScore > best.score) best = { id: entry.id, score: entryScore };
  }

  scored.sort((a, b) => b.score - a.score);
  const alternatives = scored.slice(0, 4).map((s) => s.id);

  if (best && best.score >= 0.9) {
    return {
      courseId: best.id,
      confidence: "high",
      method: "fuzzy_strong",
      alternatives: alternatives.filter((id) => id !== best!.id),
    };
  }
  if (best && best.score >= 0.6) {
    return {
      courseId: best.id,
      confidence: "possible",
      method: "fuzzy_partial",
      alternatives: alternatives.filter((id) => id !== best!.id),
    };
  }
  if (best && best.score >= 0.35) {
    return {
      courseId: best.id,
      confidence: "needs_review",
      method: "fuzzy_weak",
      alternatives: alternatives.filter((id) => id !== best!.id),
    };
  }

  // 4. No credible match. Transfer courses stay identifiable as transfers.
  return {
    courseId: null,
    confidence: "none",
    method: candidate.isTransfer ? "transfer_unmatched" : "no_match",
    alternatives,
  };
}

function disambiguateByFlags(
  entries: CatalogIndexEntry[],
  candidate: MatchCandidate,
): { id: string; confident: boolean } {
  const wantAp = candidate.isAp === true;
  const wantHonors = candidate.isHonors === true;
  const apMatch = entries.find((e) => e.ap === wantAp && e.honors === wantHonors);
  if (apMatch) return { id: apMatch.id, confident: true };
  return { id: entries[0]!.id, confident: false };
}

/** Map a confidence to a human label used in the review UI. */
export const CONFIDENCE_LABELS: Record<MatchConfidence, string> = {
  high: "High confidence",
  possible: "Possible match",
  needs_review: "Needs review",
  none: "No match",
};
