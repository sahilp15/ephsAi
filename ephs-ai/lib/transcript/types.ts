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

export interface ExtractionResult {
  rows: ExtractedCourseRow[];
  provider: string;
  /** Non-fatal issues surfaced to the student (e.g. "couldn't read image"). */
  warnings: string[];
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
