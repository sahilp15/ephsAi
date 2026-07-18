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

import type { ExtractedCourseRow } from "./types";

const GRADE_TOKEN = /\b(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F|P|NP|I|W|IP)\b/;
const CREDIT_TOKEN = /\b(\d(?:\.\d{1,2})?)\s*(?:cr|credit|credits)?\b/i;
const YEAR_TOKEN = /\b(20\d{2})\s*[-/]\s*(20\d{2}|\d{2})\b/;
const GRADE_LEVEL_TOKEN = /\b(?:grade|gr)\s*(9|10|11|12)\b/i;

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

export function parseTranscriptText(text: string): ExtractedCourseRow[] {
  const rows: ExtractedCourseRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let currentYear: string | null = null;
  let currentGrade: number | null = null;

  for (const line of lines) {
    const yearMatch = line.match(YEAR_TOKEN);
    if (yearMatch) {
      const end = yearMatch[2]!.length === 2 ? `20${yearMatch[2]}` : yearMatch[2]!;
      currentYear = `${yearMatch[1]}-${end}`;
    }
    const gradeLevelMatch = line.match(GRADE_LEVEL_TOKEN);
    if (gradeLevelMatch) currentGrade = Number(gradeLevelMatch[1]);

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
    const inProgress = /\b(in\s*progress|in-progress|\bip\b)\b/.test(lower) || finalGrade === "IP";
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
      finalGrade: inProgress ? null : finalGrade,
      creditsEarned,
      creditsAttempted: creditsEarned,
      isHonors,
      isAp,
      inProgress,
      isRepeat,
      isIncomplete,
      isTransfer,
    });
  }

  return rows;
}
