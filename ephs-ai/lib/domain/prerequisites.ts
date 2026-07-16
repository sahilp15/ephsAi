/**
 * Conservative prerequisite parser.
 *
 * The guide states prerequisites as natural language. We only produce a
 * structured interpretation when every referenced name resolves exactly to a
 * catalog course. Teacher recommendations, applications, auditions, GPA
 * criteria, concurrent enrollment, and any ambiguous phrasing are surfaced
 * as manual/unknown so the deterministic engine stays conservative — the
 * exact raw wording is always shown to the student alongside our label.
 */

export type ParsedPrerequisite =
  | { kind: "none"; raw: string | null }
  /** AND of OR-groups: every group must have at least one satisfied option. */
  | { kind: "courses"; raw: string; groups: string[][] }
  | { kind: "manual"; raw: string; reason: string }
  | { kind: "unknown"; raw: string };

const MANUAL_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /recommend/i, reason: "teacher recommendation" },
  { re: /application|apply/i, reason: "application required" },
  { re: /audition/i, reason: "audition required" },
  { re: /interview/i, reason: "interview required" },
  { re: /approval|permission|consent/i, reason: "approval required" },
  { re: /gpa|grade of|% or higher|percent/i, reason: "grade/GPA criteria" },
  { re: /concurrent|co-?requisite|enrollment in|enrolled/i, reason: "concurrent enrollment condition" },
  { re: /placement|tryout|try-?out/i, reason: "placement/tryout" },
  { re: /criteria|qualif/i, reason: "program qualification criteria" },
  { re: /special (education|services)|iep/i, reason: "special-services qualification" },
  { re: /packet|essay|summer reading/i, reason: "additional entry requirements" },
  { re: /equivalent/i, reason: "equivalency decision" },
  { re: /instructor|teacher|counselor|coordinator/i, reason: "staff decision" },
  { re: /proficient|willingness|must be|must have/i, reason: "stated personal criteria" },
  { re: /not separately stated/i, reason: "prerequisite not separately stated in the guide" },
];

/** Lead-in phrases that may precede a course name inside prerequisite text. */
const STRIP_LEADINS =
  /^(successful completion of|completion of|passing grade in|a passing grade in|credit in|one of|at least one of|any of|plus)\s+/i;

export interface PrereqParserContext {
  /** Resolve a (messy) course name to a catalog course id, or undefined. */
  resolveCourseName: (name: string) => string | undefined;
}

function tryResolveOption(
  option: string,
  ctx: PrereqParserContext,
): string | undefined {
  const cleaned = option.replace(STRIP_LEADINS, "").trim();
  if (!cleaned) return undefined;
  return ctx.resolveCourseName(cleaned);
}

export function parsePrerequisite(
  raw: string | null | undefined,
  ctx: PrereqParserContext,
): ParsedPrerequisite {
  const text = (raw ?? "").trim();
  if (!text || /^none\b/i.test(text)) {
    return { kind: "none", raw: raw ?? null };
  }

  for (const { re, reason } of MANUAL_PATTERNS) {
    if (re.test(text)) return { kind: "manual", raw: text, reason };
  }

  // Whole text may itself be a single course name.
  const whole = tryResolveOption(text, ctx);
  if (whole) return { kind: "courses", raw: text, groups: [[whole]] };

  // Split into AND segments (";", ",", " and "), then OR options (" or ").
  // "&" is NOT a separator — it appears inside official titles
  // ("Earth & Space Science", "Chemistry A & B").
  const andSegments = text
    .split(/;|,|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (andSegments.length === 0) return { kind: "unknown", raw: text };

  const groups: string[][] = [];
  for (const segment of andSegments) {
    const options = segment
      .split(/\bor\b/i)
      .map((s) => s.trim())
      .filter(Boolean);
    const resolved: string[] = [];
    for (const option of options) {
      const id = tryResolveOption(option, ctx);
      if (!id) {
        // Any unresolvable name makes the whole prerequisite unknown —
        // we never silently drop part of a requirement.
        return { kind: "unknown", raw: text };
      }
      resolved.push(id);
    }
    if (resolved.length === 0) return { kind: "unknown", raw: text };
    groups.push(resolved);
  }
  return { kind: "courses", raw: text, groups };
}
