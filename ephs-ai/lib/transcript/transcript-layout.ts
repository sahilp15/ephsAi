/**
 * Pure interpreter for an EPHS transcript's visual lines.
 *
 * Given the text of a transcript laid out as ordered lines per page-column
 * (produced by `pdf-text.ts` from pdf.js, or by a test fixture), this module
 * reconstructs course rows and the document-level facts around them.
 *
 * The layout it reads looks like this:
 *
 *     Courses Taken 2024-2025 Grade 09      <- section header: year + grade
 *     from 064 Eden Prairie High School
 *     Course Mark Weight Credit             <- column header (4 columns)
 *     01001E12 Honors English 9A A 1.0000 1.000
 *     02110E12 Honors                       <- wrapped course names
 *     PreCalculus A
 *     Total Credits: 18.000                 <- section end
 *
 *     In-Progress Courses                   <- a DIFFERENT kind of section
 *     Course Credit                         <- only 2 columns: no mark!
 *     01005E11 AP English Lang & Composition 2.000
 *
 * Two things about that in-progress block matter enormously and were the
 * source of a serious mis-import:
 *
 *   1. It carries no grade of its own. It belongs to the year the student is
 *      *about to sit*, which is stated elsewhere on the page as
 *      "Current Grade: 11" — not to whatever completed section happened to be
 *      printed above it. Inheriting the previous section's grade silently
 *      turned a junior's current courses into completed sophomore history.
 *   2. It has no Mark column, so a trailing section letter ("Cybersecurity A")
 *      must not be read as a letter grade of A.
 *
 * Everything here is pure and deterministic so it can be unit tested against
 * real transcript text without a PDF or a database.
 */

import type { ExtractedCourseRow, TranscriptMeta } from "./types";

export interface TranscriptParseResult {
  rows: ExtractedCourseRow[];
  meta: TranscriptMeta;
  /** Non-fatal problems worth showing the student on the review screen. */
  warnings: string[];
}

// A course line begins with a course code, e.g. 01001E12, OL10157G12S1,
// 502072G8, 05105G116. The code must contain a letter so page numbers and
// street addresses are not mistaken for courses. The trailing group runs to
// three digits: EPHS term-section codes like 05105G116 (9th Grade Orchestra)
// use three, and a narrower pattern silently dropped those courses along with
// the Fine Arts credit they carry.
const COURSE_CODE = /^(?:OL)?\d{4,6}[A-Z]\d{0,3}(?:S\d)?$/;

/** "Courses Taken 2024-2025 Grade 09" - a block of finished coursework. */
const SECTION = /Courses Taken\s+(\d{4})\s*-\s*(\d{4})\s+Grade\s+(\d{1,2})/i;

/** "In-Progress Courses" - the block for the year the student is starting. */
const IN_PROGRESS_HEADER = /^in[-\s]?progress\s+courses?\b/i;

/**
 * Lines that close out whatever block we were reading. Without these, the
 * credit-summary and statistics tables at the foot of the transcript keep the
 * previous section's grade alive and leak it onto unrelated rows.
 */
const SECTION_END =
  /^(?:Credit Summary|Total Credits|EPHS Academic Planner|Transcript Statistics|Cumulative GPA)\b/i;

// Structural labels that are never part of a wrapped course name. Ambiguous
// academic words (Science, English, Math, Health) are intentionally excluded:
// credit-summary rows carry a trailing credit number and are filtered by that
// instead, so those words remain usable inside real course names.
const LABEL =
  /^(?:Course|Total|from |Mark|Weight|Credit|Cumulative|Transcript|EPHS|Business\/Work|Elective|Student|State|Current|Birth|Gender|Generated|Page|Tel:|Fax:|Eden Prairie|GPA|Valley View)\b/i;
const CREDIT_NUMBER = /\d\.\d{3}/;

/** "Current Grade: 11" - the authoritative statement of where the student is. */
const CURRENT_GRADE = /Current\s+Grade:\s*(\d{1,2})/i;
/** "Student Number: 64011573 Grade: 11" - the same fact in the page header. */
const HEADER_GRADE = /\bGrade:\s*(\d{1,2})\b/i;
/** "Generated on 09/01/2026 08:50:13 AM" */
const GENERATED_ON = /Generated on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i;

/**
 * Which school year a date falls in. US school years start in late summer, so
 * anything from July onward belongs to the year that begins in that calendar
 * year; January-June belongs to the year that began the previous calendar year.
 */
export function schoolYearForDate(month: number, year: number): string {
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/** Parse a completed-course line: name, letter mark, optional weight, credit. */
function parseCompletedText(text: string): {
  name: string;
  finalGrade: string | null;
  credits: number | null;
} {
  // name  MARK  WEIGHT  CREDIT  [wrapped name tail]
  let m = text.match(
    /^(.*?)\s+([A-F][+-]?|P|NP|IP|I|W)\s+(\d\.\d{4})\s+(\d\.\d{3})\s*(.*)$/,
  );
  if (m) {
    return {
      name: `${m[1]} ${m[5]}`.replace(/\s+/g, " ").trim(),
      finalGrade: m[2]!,
      credits: Number(m[4]),
    };
  }
  // name  MARK  CREDIT  [wrapped name tail]
  m = text.match(/^(.*?)\s+([A-F][+-]?|P|NP|IP|I|W)\s+(\d\.\d{3})\s*(.*)$/);
  if (m) {
    return {
      name: `${m[1]} ${m[4]}`.replace(/\s+/g, " ").trim(),
      finalGrade: m[2]!,
      credits: Number(m[3]),
    };
  }
  return {
    name: text.replace(/\s+\d\.\d{3,4}/g, "").replace(/\s+/g, " ").trim(),
    finalGrade: null,
    credits: null,
  };
}

/**
 * Parse an in-progress line: name then credit, with **no mark column**.
 *
 * "10258G12 Cybersecurity A 1.000" is Cybersecurity A (the section letter),
 * carrying 1.000 credit - not a course graded A. Reusing the completed-course
 * parser here would invent a letter grade out of the section letter and, worse,
 * make an unfinished course look finished.
 */
function parseInProgressText(text: string): { name: string; credits: number | null } {
  const m = text.match(/^(.*?)\s+(\d\.\d{3})\s*$/);
  if (m) {
    return { name: m[1]!.replace(/\s+/g, " ").trim(), credits: Number(m[2]) };
  }
  return {
    name: text.replace(/\s+\d\.\d{3,4}/g, "").replace(/\s+/g, " ").trim(),
    credits: null,
  };
}

/** Normalize a raw transcript course title toward the catalog's spelling. */
function normalizeName(raw: string): string {
  // Transcripts glue the section letter to the year/level ("English 9A",
  // "French 2B"); the catalog writes them apart ("English 9 A & B"). Split a
  // digit directly followed by a capital letter so titles line up for matching,
  // and expand the common "Comp Sci" abbreviation to its catalog spelling.
  return raw
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/\bComp Sci\b/gi, "Computer Science")
    .replace(/\b(Skinny)([AB])\b/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Some rows carry their term as a trailing token in the title rather than in
 * the course code ("9th Grade Orchestra T1"). Lift it out so the title matches
 * the catalog and the course lands in the right term.
 */
function splitTrailingTerm(name: string): { name: string; term: string | null } {
  const m = name.match(/^(.*?)\s+([TQ])([1-4])$/i);
  if (!m) return { name, term: null };
  return { name: m[1]!.trim(), term: `T${m[3]}` };
}

interface PendingCourse {
  code: string;
  text: string;
  grade: number | null;
  year: string | null;
  inProgress: boolean;
}

function toRow(pending: PendingCourse): ExtractedCourseRow | null {
  const { code, text, grade, year, inProgress } = pending;

  const parsed = inProgress
    ? { ...parseInProgressText(text), finalGrade: null as string | null }
    : parseCompletedText(text);
  const { name, term: trailingTerm } = splitTrailingTerm(normalizeName(parsed.name));
  if (!name || name.replace(/[^a-z]/gi, "").length < 3) return null;

  const finalGrade = parsed.finalGrade;
  const credits = parsed.credits;
  const lower = name.toLowerCase();
  // A completed row explicitly marked IP is in progress too.
  const rowInProgress = inProgress || finalGrade === "IP";

  // EPHS course codes encode the four-term year as an S1-S4 suffix. These are
  // terms, not semesters, so normalize them to T1-T4 (a bare S1/S2 would be
  // misread as a two-term semester downstream).
  const termMatch = code.match(/S([1-4])\b/);
  return {
    rawCourseName: name,
    rawCourseCode: code,
    schoolYear: year,
    gradeLevel: grade,
    term: termMatch ? `T${termMatch[1]}` : trailingTerm,
    finalGrade: rowInProgress ? null : finalGrade,
    // Credits on an in-progress course are not earned yet - they are attempted.
    creditsEarned: rowInProgress ? null : credits,
    creditsAttempted: credits,
    isHonors: /\bhonors?\b|\bhon\b/.test(lower),
    isAp: /\bap\b|advanced placement/.test(lower),
    inProgress: rowInProgress,
    isRepeat: false,
    isIncomplete: finalGrade === "I",
    isTransfer: false,
  };
}

/**
 * First pass: read the facts printed about the student rather than about any
 * one course. Done over the whole document before any row is built, because
 * "Current Grade: 11" sits in the page-1 header while the in-progress block
 * that needs it is on page 2.
 */
function readMeta(allLines: string[]): TranscriptMeta {
  let currentGrade: number | null = null;
  let headerGrade: number | null = null;
  let generatedOn: string | null = null;

  for (const line of allLines) {
    const cg = line.match(CURRENT_GRADE);
    if (cg && currentGrade === null) currentGrade = Number(cg[1]);
    const hg = line.match(HEADER_GRADE);
    if (hg && headerGrade === null) headerGrade = Number(hg[1]);
    const gen = line.match(GENERATED_ON);
    if (gen && generatedOn === null) generatedOn = gen[1]!;
  }

  const grade = currentGrade ?? headerGrade;
  let currentSchoolYear: string | null = null;
  if (generatedOn) {
    const [mm, , yyyy] = generatedOn.split("/");
    currentSchoolYear = schoolYearForDate(Number(mm), Number(yyyy));
  }

  return {
    currentGrade: grade !== null && grade >= 1 && grade <= 12 ? grade : null,
    currentSchoolYear,
    generatedOn,
  };
}

/**
 * Interpret a transcript laid out as ordered lines per page-column.
 *
 * `columns` is in reading order: page 1 left, page 1 right, page 2 left, ...
 */
export function parseTranscriptColumns(columns: string[][]): TranscriptParseResult {
  const meta = readMeta(columns.flat());
  const warnings: string[] = [];
  const rows: ExtractedCourseRow[] = [];

  // Grade the in-progress block belongs to. It is the year the student is
  // starting now, which the transcript states as "Current Grade".
  let inProgressGrade = meta.currentGrade;
  let sawInProgressBlock = false;
  let highestCompletedGrade: number | null = null;

  for (const lines of columns) {
    let year: string | null = null;
    let grade: number | null = null;
    let inProgressMode = false;
    let current: PendingCourse | null = null;

    const flush = () => {
      if (!current) return;
      const row = toRow(current);
      if (row) rows.push(row);
      current = null;
    };

    for (const line of lines) {
      const sm = line.match(SECTION);
      if (sm) {
        flush();
        year = `${sm[1]}-${sm[2]}`;
        grade = Number(sm[3]);
        inProgressMode = false;
        if (grade !== null && (highestCompletedGrade === null || grade > highestCompletedGrade)) {
          highestCompletedGrade = grade;
        }
        continue;
      }

      if (IN_PROGRESS_HEADER.test(line)) {
        // A new block that owns neither the previous section's grade nor its
        // year. Both are re-derived from the student's current grade below.
        flush();
        inProgressMode = true;
        sawInProgressBlock = true;
        grade = null;
        year = meta.currentSchoolYear;
        continue;
      }

      if (SECTION_END.test(line)) {
        flush();
        // Stop the section's grade from leaking onto the summary tables that
        // follow it.
        inProgressMode = false;
        grade = null;
        year = null;
        continue;
      }

      const first = line.split(" ")[0] ?? "";
      if (COURSE_CODE.test(first)) {
        flush();
        current = {
          code: first,
          text: line.slice(first.length).trim(),
          grade: inProgressMode ? null : grade,
          year,
          inProgress: inProgressMode,
        };
      } else if (current && !LABEL.test(line) && !CREDIT_NUMBER.test(line)) {
        // Wrapped continuation of the current course name.
        current.text += ` ${line}`;
      } else {
        flush();
      }
    }
    flush();
  }

  // Second pass: in-progress rows now get the grade they actually belong to.
  // When the transcript never states a current grade we infer it as one year
  // past the highest completed section, which is the only reading consistent
  // with those courses being unfinished.
  if (inProgressGrade === null && sawInProgressBlock && highestCompletedGrade !== null) {
    inProgressGrade = Math.min(12, highestCompletedGrade + 1);
    warnings.push(
      `This transcript doesn't state a current grade, so in-progress courses were placed in grade ${inProgressGrade}. Change the grade on any row that looks wrong.`,
    );
  }
  for (const row of rows) {
    if (row.inProgress && row.gradeLevel == null) row.gradeLevel = inProgressGrade;
  }

  // Honesty check: a course cannot be *finished* in a grade the student has not
  // reached yet. If we ever see that, the section headers were misread - say so
  // instead of quietly showing a student coursework they have not taken.
  if (meta.currentGrade !== null) {
    const impossible = rows.filter(
      (r) => !r.inProgress && typeof r.gradeLevel === "number" && r.gradeLevel > meta.currentGrade!,
    );
    if (impossible.length > 0) {
      warnings.push(
        `${impossible.length} course${impossible.length === 1 ? "" : "s"} read as completed above grade ${meta.currentGrade}, which isn't possible yet. Please check those rows before confirming.`,
      );
    }
  }

  return { rows, meta, warnings };
}
