/**
 * Pure, deterministic transcript-text parser.
 *
 * Turns the plain-text representation of a transcript (from a text-based PDF,
 * an OCR pass, or a paste) into structured course rows. It is intentionally
 * conservative: it detects course lines, pulls out grade/credits/term signals
 * when present, and flags Honors/AP/in-progress/transfer — but it never
 * invents data. Anything it cannot read is simply omitted, leaving the student
 * to add it manually. Unit tested.
 */

import type { ExtractedCourseRow, TranscriptMeta } from "./types";

// Two-character grades are listed first so "B+" wins over a bare "B"; lookarounds
// (not \b) are used so the trailing "+"/"-" is not truncated.
const GRADE_TOKEN =
  /(?<![A-Za-z+])(A\+|A-|B\+|B-|C\+|C-|D\+|D-|IP|NP|A|B|C|D|F|P|I|W)(?![A-Za-z])/;
const YEAR_TOKEN = /\b(20\d{2})\s*[-/]\s*(20\d{2}|\d{2})\b/;
// Section grade levels are often zero-padded on real transcripts ("Grade 09"),
// which a bare 9|10|11|12 alternation silently fails to match - leaving every
// course in that section with no grade at all.
const GRADE_LEVEL_TOKEN = /\b(?:grade|gr)\s*(0?9|1[0-2])\b/i;
/** "Current Grade: 11" - the grade the student is in now, not a section header. */
const CURRENT_GRADE_TOKEN = /\bcurrent\s+grade:?\s*(0?9|1[0-2])\b/i;
/** Start of the block listing courses the student has not finished yet. */
const IN_PROGRESS_HEADER = /^in[-\s]?progress\s+courses?\b/i;
/** Lines that end a section, so its grade level stops applying to later rows. */
const SECTION_END = /^(?:credit summary|total credits|ephs academic planner)\b/i;

/** Header/footer/label lines that are never courses. */
const NOISE = /^(transcript|student|name|id|school|grade point|gpa|cumulative|weighted|unweighted|total|credits?|year|term|semester|course|title|mark|earned|attempted|page \d|eden prairie|official|date|printed|withdrawn?)/i;

function detectTerm(line: string): string | null {
  const t = line.toLowerCase();
  const termMatch = t.match(/\b(?:t|term)\s*([1-4])\b/);
  if (termMatch) return `T${termMatch[1]}`;
  if (/\bs1\b|semester\s*1|\bfall\b/.test(t)) return "S1";
  if (/\bs2\b|semester\s*2|\bspring\b/.test(t)) return "S2";
  if (/full\s*year|\byear\b/.test(t)) return "Full Year";
  return null;
}

function stripToName(line: string): string {
  return line
    .replace(YEAR_TOKEN, " ")
    .replace(GRADE_LEVEL_TOKEN, " ")
    .replace(/\b(?:t|term)\s*[1-4]\b/gi, " ")
    .replace(/\bsemester\s*[12]\b/gi, " ")
    .replace(/\b(s1|s2|q[1-4])\b/gi, " ")
    .replace(/\b\d(?:\.\d{1,2})?\s*(?:cr|credits?)\b/gi, " ")
    .replace(/\b(?:in\s*progress|in-progress|transfer|repeat(?:ed)?|incomplete)\b/gi, " ")
    .replace(/\s+[A-DF][+-]?\s*$/,'') // trailing letter grade
    .replace(/[|·•\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** True when a line plausibly names a course (has letters and enough length). */
function looksLikeCourse(name: string): boolean {
  if (name.length < 3) return false;
  if (!/[a-z]{3,}/i.test(name)) return false;
  // reject lines that are pure numbers / codes
  if (/^[\d\s.]+$/.test(name)) return false;
  return true;
}

export interface TextParseResult {
  rows: ExtractedCourseRow[];
  meta: TranscriptMeta;
}

/**
 * Parse transcript text into rows plus the document-level facts around them.
 *
 * Section grade levels and the student's *current* grade are different things:
 * a section header ("Grade 10") labels finished coursework, while
 * "Current Grade: 11" says where the student is now. The in-progress block
 * belongs to the latter - inheriting the last section header instead turns
 * unfinished courses into completed history a year too early.
 */
export function parseTranscriptDocument(text: string): TextParseResult {
  const rows: ExtractedCourseRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let currentYear: string | null = null;
  let currentGrade: number | null = null;
  let studentCurrentGrade: number | null = null;
  let inProgressSection = false;

  for (const line of lines) {
    // "Current Grade: 11" is student metadata, never a section header. Read it
    // first so it is not mistaken for one by GRADE_LEVEL_TOKEN below.
    const currentGradeMatch = line.match(CURRENT_GRADE_TOKEN);
    if (currentGradeMatch) {
      studentCurrentGrade = Number(currentGradeMatch[1]);
      continue;
    }

    if (IN_PROGRESS_HEADER.test(line)) {
      inProgressSection = true;
      currentGrade = null;
      currentYear = null;
      continue;
    }

    if (SECTION_END.test(line)) {
      inProgressSection = false;
      currentGrade = null;
      currentYear = null;
      continue;
    }

    const yearMatch = line.match(YEAR_TOKEN);
    if (yearMatch) {
      const end = yearMatch[2]!.length === 2 ? `20${yearMatch[2]}` : yearMatch[2]!;
      currentYear = `${yearMatch[1]}-${end}`;
      inProgressSection = false;
    }
    const gradeLevelMatch = line.match(GRADE_LEVEL_TOKEN);
    if (gradeLevelMatch) {
      currentGrade = Number(gradeLevelMatch[1]);
      inProgressSection = false;
    }

    if (NOISE.test(line)) continue;

    const name = stripToName(line);
    if (!looksLikeCourse(name)) continue;

    const gradeMatch = line.match(GRADE_TOKEN);
    const finalGrade = gradeMatch ? gradeMatch[1]! : null;

    // Credits: prefer a token adjacent to "cr"/"credit"; else a standalone .5/1.0.
    let creditsEarned: number | null = null;
    const creditMatch = line.match(/\b(\d(?:\.\d{1,2})?)\s*(?:cr|credits?)\b/i);
    if (creditMatch) creditsEarned = Number(creditMatch[1]);
    else {
      const bare = line.match(/\b(0?\.\d{1,2}|1(?:\.0)?)\b/);
      if (bare) creditsEarned = Number(bare[1]);
    }

    const lower = line.toLowerCase();
    const inProgress =
      inProgressSection ||
      /\b(in\s*progress|in-progress|\bip\b)\b/.test(lower) ||
      finalGrade === "IP";
    const isTransfer = /\btransfer\b|\btc\b/.test(lower);
    const isRepeat = /\brepeat(?:ed)?\b/.test(lower);
    const isIncomplete = /\bincomplete\b/.test(lower) || finalGrade === "I";
    const isHonors = /\bhonors?\b/.test(lower);
    const isAp = /\bap\b|advanced placement/.test(lower);

    rows.push({
      rawCourseName: name,
      schoolYear: currentYear,
      gradeLevel: currentGrade,
      term: detectTerm(line),
      // A row inside the in-progress block has no mark; anything the grade
      // scanner picked up there is a section letter, not a final grade.
      finalGrade: inProgress ? null : finalGrade,
      creditsEarned: inProgress ? null : creditsEarned,
      creditsAttempted: creditsEarned,
      isHonors,
      isAp,
      inProgress,
      isRepeat,
      isIncomplete,
      isTransfer,
    });
  }

  // In-progress courses belong to the grade the student is in now. Fall back to
  // one past the highest completed section when the transcript never says.
  const highestCompleted = rows.reduce<number | null>(
    (max, r) =>
      !r.inProgress && typeof r.gradeLevel === "number" && (max === null || r.gradeLevel > max)
        ? r.gradeLevel
        : max,
    null,
  );
  const inProgressGrade =
    studentCurrentGrade ?? (highestCompleted !== null ? Math.min(12, highestCompleted + 1) : null);
  for (const row of rows) {
    if (row.inProgress && row.gradeLevel == null) row.gradeLevel = inProgressGrade;
  }

  return {
    rows,
    meta: {
      currentGrade: studentCurrentGrade,
      currentSchoolYear: null,
      generatedOn: null,
    },
  };
}

/** Row-only view of {@link parseTranscriptDocument}. */
export function parseTranscriptText(text: string): ExtractedCourseRow[] {
  return parseTranscriptDocument(text).rows;
}
