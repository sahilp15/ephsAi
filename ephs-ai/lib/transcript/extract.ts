import "server-only";
import { getCatalogMatchIndex } from "@/lib/catalog/match-index";
import {
  matchTranscriptCourse,
  type MatchConfidence,
} from "@/lib/domain/transcript-match";
import { getEquivalencyMap } from "@/lib/data/equivalencies";
import { getExtractionProvider } from "./provider";
import type { ExtractionInput, TranscriptExtractionProvider } from "./types";

/**
 * A single extracted transcript row after it has been matched against the
 * EPHS catalog. This is the shared shape both the authenticated pipeline
 * (`processTranscript`, which persists these to Postgres) and the no-login
 * preview upload route consume, so the extraction + matching behavior is
 * identical in both places.
 */
export interface MatchedTranscriptRow {
  rowIndex: number;
  rawCourseName: string;
  rawCourseCode: string | null;
  schoolYear: string | null;
  gradeLevel: number | null;
  term: string | null;
  finalGrade: string | null;
  creditsAttempted: number | null;
  creditsEarned: number | null;
  courseLevel: string | null;
  isHonors: boolean;
  isAp: boolean;
  inProgress: boolean;
  isRepeat: boolean;
  isIncomplete: boolean;
  isTransfer: boolean;
  matchedCourseId: string | null;
  matchConfidence: MatchConfidence;
  matchMethod: string;
  raw: Record<string, unknown>;
}

export interface ExtractAndMatchResult {
  provider: string;
  rows: MatchedTranscriptRow[];
  warnings: string[];
}

/**
 * Extract structured course rows from a transcript file and match each one to
 * the EPHS catalog with an honest confidence level. Pure of any persistence:
 * callers decide whether to store the results (authenticated flow) or hand
 * them straight back to the browser (preview flow).
 */
export async function extractAndMatchTranscript(
  input: ExtractionInput,
  provider: TranscriptExtractionProvider = getExtractionProvider(),
): Promise<ExtractAndMatchResult> {
  const result = await provider.extract(input);
  const index = getCatalogMatchIndex();
  const equivalencies = await getEquivalencyMap();

  const rows: MatchedTranscriptRow[] = result.rows.map((r, i) => {
    const match = matchTranscriptCourse(
      {
        name: r.rawCourseName,
        code: r.rawCourseCode,
        isHonors: r.isHonors,
        isAp: r.isAp,
        isTransfer: r.isTransfer,
      },
      { entries: index, equivalencies },
    );
    return {
      rowIndex: i,
      rawCourseName: r.rawCourseName,
      rawCourseCode: r.rawCourseCode ?? null,
      schoolYear: r.schoolYear ?? null,
      gradeLevel: r.gradeLevel ?? null,
      term: r.term ?? null,
      finalGrade: r.finalGrade ?? null,
      creditsAttempted: r.creditsAttempted ?? null,
      creditsEarned: r.creditsEarned ?? null,
      courseLevel: r.courseLevel ?? null,
      isHonors: Boolean(r.isHonors),
      isAp: Boolean(r.isAp),
      inProgress: Boolean(r.inProgress),
      isRepeat: Boolean(r.isRepeat),
      isIncomplete: Boolean(r.isIncomplete),
      isTransfer: Boolean(r.isTransfer),
      matchedCourseId: match.courseId,
      matchConfidence: match.confidence,
      matchMethod: match.method,
      raw: r as unknown as Record<string, unknown>,
    };
  });

  return { provider: provider.name, rows, warnings: result.warnings };
}
