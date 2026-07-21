/**
 * Shared fuzzy / synonym search helpers.
 *
 * Pure, dependency-free, and safe to run on both the server and (if ever
 * needed) the client. Used by the clubs search (`lib/clubs/search.ts`) and the
 * chatbot retrieval (`lib/ai/chat.ts`) so that student typos, slang, and
 * related-interest phrasing resolve to the same official records everywhere.
 *
 * This never invents data — it only makes matching against the real, official
 * course and club records more forgiving.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "the", "for", "of", "to", "in", "on", "is", "are", "do",
  "does", "we", "have", "any", "what", "which", "who", "how", "i", "im", "i'm",
  "me", "my", "some", "something", "related", "about", "with", "that", "meet",
  "meets", "good", "would", "be", "can", "could", "should", "there", "get",
  "into", "like", "want", "join", "am", "it", "at", "or", "club", "clubs",
  "class", "classes", "course", "courses", "help", "helps", "interested",
]);

/**
 * Related-interest expansion. Maps a student's word to official-vocabulary
 * terms that appear in real club/course names, descriptions, and categories.
 * Keys are already-normalized tokens (lowercase, no punctuation).
 */
export const SYNONYMS: Record<string, string[]> = {
  // computing
  cs: ["computer", "science", "coding", "programming", "software", "tech"],
  coding: ["computer", "programming", "software", "code", "robotics"],
  code: ["computer", "programming", "software", "coding"],
  programming: ["computer", "software", "coding", "code"],
  computer: ["coding", "programming", "software", "technology"],
  tech: ["technology", "computer", "engineering", "software"],
  technology: ["computer", "engineering", "tech", "software"],
  software: ["computer", "coding", "programming"],
  ai: ["computer", "technology", "science"],
  robot: ["robotics", "engineering", "build", "team"],
  robots: ["robotics", "engineering"],
  robotics: ["engineering", "build", "team", "science"],
  // engineering
  engineer: ["engineering", "robotics", "technology", "physics", "build"],
  engineering: ["robotics", "technology", "physics", "build", "science"],
  build: ["engineering", "robotics", "make"],
  // medicine / health
  med: ["medicine", "medical", "health", "science", "biology"],
  medicine: ["medical", "health", "science", "biology", "hosa"],
  medical: ["medicine", "health", "science", "biology"],
  health: ["medicine", "medical", "science", "biology", "wellness"],
  healthcare: ["medicine", "medical", "health", "science"],
  premed: ["medicine", "medical", "health", "science", "biology"],
  doctor: ["medicine", "medical", "health", "science"],
  nurse: ["medicine", "medical", "health"],
  biology: ["science", "medical", "health"],
  // business / finance
  business: ["deca", "marketing", "entrepreneur", "finance", "bpa", "management"],
  buisness: ["business", "deca", "marketing", "finance"],
  finance: ["business", "investing", "money", "economics", "deca", "marketing"],
  investing: ["finance", "business", "stock", "money", "economics"],
  invest: ["finance", "business", "investing", "money"],
  stock: ["finance", "investing", "business"],
  money: ["finance", "business", "economics"],
  marketing: ["business", "deca", "advertising"],
  entrepreneur: ["business", "startup", "deca"],
  economics: ["business", "finance"],
  // law / politics / speaking
  law: ["debate", "government", "politics", "mock", "trial", "speech", "legal"],
  legal: ["law", "debate", "government", "mock", "trial"],
  politics: ["government", "debate", "democrat", "republican", "civic", "model"],
  political: ["politics", "government", "debate", "civic"],
  government: ["politics", "civic", "debate", "model"],
  debate: ["speech", "argument", "law", "forensics"],
  speech: ["debate", "speaking", "forensics", "presentation"],
  speaking: ["speech", "debate", "presentation", "communication", "improv"],
  presentation: ["speech", "speaking", "communication"],
  communication: ["speech", "speaking", "media", "journalism"],
  leadership: ["council", "student", "leader", "service", "advisory"],
  // arts / media
  art: ["arts", "drawing", "painting", "creative", "visual", "photography"],
  arts: ["art", "creative", "drama", "music", "visual"],
  drawing: ["art", "arts", "visual"],
  music: ["band", "choir", "orchestra", "arts"],
  drama: ["theater", "theatre", "acting", "improv", "arts"],
  theater: ["drama", "acting", "improv", "arts"],
  acting: ["drama", "theater", "improv"],
  photography: ["photo", "camera", "art", "visual"],
  writing: ["literary", "newspaper", "journalism", "creative", "eaglit", "eyrie"],
  journalism: ["newspaper", "writing", "media", "eyrie"],
  newspaper: ["journalism", "writing", "media", "eyrie"],
  anime: ["manga", "japanese", "culture"],
  // service / social
  volunteer: ["service", "community", "habitat", "key", "interact", "relay"],
  service: ["volunteer", "community", "habitat", "key", "interact", "leadership"],
  community: ["service", "volunteer", "habitat"],
  charity: ["service", "volunteer", "relay", "habitat"],
  environment: ["environmental", "sustainability", "tree", "conservation", "green"],
  environmental: ["environment", "sustainability", "tree", "green"],
  // social / meeting people
  shy: ["friends", "social", "meet", "welcome", "buddies", "peer"],
  friends: ["social", "buddies", "peer", "welcome", "meet"],
  social: ["friends", "meet", "buddies", "peer"],
  meet: ["friends", "social", "people"],
  people: ["friends", "social", "meet"],
  // languages / culture
  language: ["french", "german", "spanish", "sign", "culture"],
  culture: ["cultural", "diversity", "language", "exchange"],
  cultural: ["culture", "diversity", "language"],
  diversity: ["cultural", "culture", "inclusion", "equity"],
  // stem general
  science: ["stem", "physics", "biology", "chemistry", "olympiad", "research"],
  math: ["mathematics", "stem", "team", "olympiad"],
  physics: ["science", "stem", "engineering"],
  chess: ["strategy", "board", "game"],
  // recreation
  sport: ["sports", "recreation", "badminton", "bowling", "dodgeball", "ping"],
  sports: ["recreation", "badminton", "bowling", "dodgeball", "athletic"],
  game: ["games", "chess", "recreation", "anime"],
};

const APOSTROPHE = /[’'`]/g;

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(APOSTROPHE, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Split query into meaningful, de-stopworded tokens. */
export function tokenize(s: string): string[] {
  return normalizeText(s)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Classic Levenshtein edit distance (bounded loops, small strings). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = new Array<number>(b.length + 1);
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    prev = curr;
  }
  return prev[b.length] ?? 0;
}

/**
 * Typo-tolerant edit distance allowance that scales with word length. Kept
 * conservative (distance 2 only for long words) so short words like "mining"
 * don't spuriously match "making".
 */
function allowedEdits(term: string): number {
  if (term.length <= 3) return 0;
  if (term.length <= 7) return 1;
  return 2;
}

/**
 * Does `term` match anywhere in the tokenized haystack, allowing for typos?
 * Substring match first (cheap), then bounded fuzzy against each token.
 */
export function fuzzyTokenMatch(haystackTokens: string[], term: string): boolean {
  if (term.length <= 1) return false;
  for (const tok of haystackTokens) {
    if (tok === term || tok.includes(term) || term.includes(tok)) return true;
  }
  const budget = allowedEdits(term);
  if (budget === 0) return false;
  for (const tok of haystackTokens) {
    if (Math.abs(tok.length - term.length) > budget) continue;
    if (levenshtein(tok, term) <= budget) return true;
  }
  return false;
}

/**
 * Expand a raw query into weighted search terms:
 *  - the original tokens (weight 1.0)
 *  - synonym / related-interest tokens (weight 0.5)
 * Returns a de-duplicated list of `{ term, weight }`.
 */
export function expandQuery(q: string): Array<{ term: string; weight: number }> {
  const base = tokenize(q);
  const out = new Map<string, number>();
  for (const t of base) {
    out.set(t, Math.max(out.get(t) ?? 0, 1));
    for (const syn of SYNONYMS[t] ?? []) {
      out.set(syn, Math.max(out.get(syn) ?? 0, 0.5));
    }
  }
  return Array.from(out, ([term, weight]) => ({ term, weight }));
}

/** Extract weekday names referenced in free text (for "meets Tuesday" queries). */
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
export function weekdaysIn(q: string): string[] {
  const n = normalizeText(q);
  return WEEKDAYS.filter((d) => n.includes(d.slice(0, 3)));
}
