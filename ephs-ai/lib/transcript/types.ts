/**
 * Shared transcript-extraction types. Kept provider-neutral so OCR / AI
 * document-extraction backends can be swapped without touching callers.
 */

export interface ExtractedCourseRow {
  rawCourseName: string;
  rawCourseCode?: string | null;
  schoolYear?: string | null;
  gradeLevel?: number | null;
  term?: string | null;
  finalGrade?: string | null;
  creditsAttempted?: number | null;
  creditsEarned?: number | null;
  courseLevel?: string | null;
  isHonors?: boolean;
  isAp?: boolean;
  inProgress?: boolean;
  isRepeat?: boolean;
  isIncomplete?: boolean;
  isTransfer?: boolean;
}

/**
 * Document-level facts read off the transcript itself (not per course).
 *
 * `currentGrade` is the single most important one: a transcript lists the
 * grades a student has *finished*, so without it there is no way to tell that
 * the "In-Progress Courses" block belongs to the year they are about to start
 * rather than to the last completed section on the page.
 */
export interface TranscriptMeta {
  /** The grade the student is in now, e.g. 11 from "Current Grade: 11". */
  currentGrade: number | null;
  /** School year the in-progress courses belong to, e.g. "2026-2027". */
  currentSchoolYear: string | null;
  /** Date the transcript was generated, ISO-ish as printed (MM/DD/YYYY). */
  generatedOn: string | null;
}

export const EMPTY_TRANSCRIPT_META: TranscriptMeta = {
  currentGrade: null,
  currentSchoolYear: null,
  generatedOn: null,
};

export interface ExtractionResult {
  rows: ExtractedCourseRow[];
  provider: string;
  /** Non-fatal issues surfaced to the student (e.g. "couldn't read image"). */
  warnings: string[];
  /** Document-level facts (current grade / year) when the format exposes them. */
  meta?: TranscriptMeta;
}

export interface ExtractionInput {
  bytes: Buffer;
  mimeType: string;
  filename: string;
}

export interface TranscriptExtractionProvider {
  name: string;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}
