/**
 * Interpret the guide's `term_length_interpretation` strings into a term
 * span usable by the four-term planner.
 *
 * EPHS runs a four-term school year; the guide describes a "semester" as two
 * consecutive academic terms. Where the guide's wording does not determine an
 * exact span, we return `terms: null` and require counselor verification -
 * we never guess scheduling the source does not state.
 */

export interface TermSpan {
  /** Number of consecutive terms the course occupies, or null when the source does not determine it. */
  terms: number | null;
  /** Human label taken from / derived from the source wording. */
  label: string;
  /** True when exact scheduling must be counselor verified. */
  requiresVerification: boolean;
  /** True for repeatable/term-based courses. */
  repeatable: boolean;
}

export function interpretTermSpan(raw: string | null | undefined): TermSpan {
  const label = raw ?? "Term length not stated in the guide";
  if (!raw) {
    return { terms: null, label, requiresVerification: true, repeatable: false };
  }
  const s = raw.toLowerCase();

  if (s.includes("full year")) {
    return { terms: 4, label, requiresVerification: false, repeatable: false };
  }
  if (s.includes("three terms")) {
    return { terms: 3, label, requiresVerification: false, repeatable: false };
  }
  if (s.includes("repeatable")) {
    return { terms: 1, label, requiresVerification: false, repeatable: true };
  }
  if (s.includes("skinny")) {
    // Skinny formats share a block; exact placement must be counselor verified.
    return { terms: null, label, requiresVerification: true, repeatable: false };
  }
  if (s.includes("multi-term program")) {
    return { terms: null, label, requiresVerification: true, repeatable: false };
  }
  if (s.includes("two terms") || s.includes("one semester")) {
    return { terms: 2, label, requiresVerification: false, repeatable: false };
  }
  if (s.includes("one term")) {
    return { terms: 1, label, requiresVerification: false, repeatable: false };
  }
  return { terms: null, label, requiresVerification: true, repeatable: false };
}
