import "server-only";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { ExtractedCourseRow } from "./types";

/**
 * Text extraction for real, text-based transcript PDFs.
 *
 * School transcripts (Infinite Campus / Apache FOP and similar) store their
 * text in FlateDecode-compressed streams with font-subset ToUnicode encoding
 * and a multi-column, wrap-heavy table layout. A regex over the raw bytes
 * cannot read them, so we use pdf.js (`pdfjs-dist`) to get positioned text and
 * then reconstruct course rows: split each page into columns, group text into
 * visual lines, merge wrapped course-name lines, and pull out grade and credit.
 *
 * pdf.js runs only on the server and is loaded lazily so it never enters the
 * client bundle. If anything fails (encrypted, image-only, or an unexpected
 * layout) we return null and the caller falls back to the plain-text path.
 */

// pdf.js 4.x uses Promise.withResolvers, which only exists on Node 22+. Polyfill
// it so extraction also works on Node 18/20 deployments.
if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
  (Promise as unknown as { withResolvers: () => unknown }).withResolvers = function <T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

interface PositionedItem {
  x: number;
  y: number;
  s: string;
}

// A course line begins with a course code, e.g. 01001E12, OL10157G12S1, 502072G8.
// The code must contain a letter so page numbers / addresses are not mistaken
// for courses.
const COURSE_CODE = /^(?:OL)?\d{4,6}[A-Z]\d{0,2}(?:S\d)?$|^\d{5,6}[A-Z]\d?$/;
const SECTION = /Courses Taken\s+(\d{4})-(\d{4})\s+Grade\s+(\d{1,2})/i;
// Structural labels that are never part of a wrapped course name. Ambiguous
// academic words (Science, English, Math, Health) are intentionally excluded:
// credit-summary rows carry a trailing credit number and are filtered by that
// instead, so those words remain usable inside real course names.
const LABEL =
  /^(?:Course|Total|from |Mark|Weight|Credit|Cumulative|Transcript|EPHS|Business\/Work|Elective|Student|State|Current|Birth|Gender|Generated|Page|Tel:|Fax:|Eden Prairie|GPA|Valley View)\b/i;
const CREDIT_NUMBER = /\d\.\d{3}/;

function parseCourseText(text: string): {
  name: string;
  finalGrade: string | null;
  credits: number | null;
} {
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

function toRow(
  code: string,
  text: string,
  gradeLevel: number | null,
  schoolYear: string | null,
): ExtractedCourseRow | null {
  const parsed = parseCourseText(text);
  // Transcripts glue the section letter to the year/level ("English 9A",
  // "French 2B"); the catalog writes them apart ("English 9 A & B"). Split a
  // digit directly followed by a capital letter so titles line up for matching,
  // and expand the common "Comp Sci" abbreviation to its catalog spelling.
  const name = parsed.name
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/\bComp Sci\b/gi, "Computer Science")
    .replace(/\s+/g, " ")
    .trim();
  const { finalGrade, credits } = parsed;
  if (!name || name.replace(/[^a-z]/gi, "").length < 3) return null;

  const lower = name.toLowerCase();
  const inProgress = finalGrade === "IP";
  const termMatch = code.match(/S([1-4])\b/);
  return {
    rawCourseName: name,
    rawCourseCode: code,
    schoolYear,
    gradeLevel,
    term: termMatch ? `S${termMatch[1]}` : null,
    finalGrade: inProgress ? null : finalGrade,
    creditsEarned: credits,
    creditsAttempted: credits,
    isHonors: /\bhonors?\b|\bhon\b/.test(lower),
    isAp: /\bap\b|advanced placement/.test(lower),
    inProgress,
    isRepeat: false,
    isIncomplete: finalGrade === "I",
    isTransfer: false,
  };
}

/**
 * Extract structured course rows from a text-based transcript PDF. Returns null
 * when the document can't be read as text (so the caller can fall back), and an
 * empty array only when it was read but held no recognizable courses.
 */
export async function extractPdfCourseRows(
  bytes: Buffer,
): Promise<ExtractedCourseRow[] | null> {
  let pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // In the bundled server runtime pdf.js can't auto-locate its worker entry,
    // so point it at the real file. It runs on the main thread (no separate
    // worker process); this just satisfies the fake-worker setup.
    try {
      const require = createRequire(join(process.cwd(), "package.json"));
      pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
      );
    } catch {
      /* fall back to pdf.js default resolution */
    }
  } catch (err) {
    console.error("[transcript] pdf.js load failed:", err instanceof Error ? err.message : err);
    return null;
  }

  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      useSystemFonts: false,
      verbosity: 0,
    });
    const doc = await loadingTask.promise;

    const rows: ExtractedCourseRow[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const midX = viewport.width / 2;
      const content = await page.getTextContent();

      // Two columns, split at the page midpoint.
      const columns: PositionedItem[][] = [[], []];
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        columns[x < midX ? 0 : 1]!.push({ x, y, s: item.str.trim() });
      }

      for (const column of columns) {
        const byRow = new Map<number, PositionedItem[]>();
        for (const it of column) {
          const key = Math.round(it.y);
          const list = byRow.get(key) ?? [];
          list.push(it);
          byRow.set(key, list);
        }
        const visualLines = [...byRow.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, parts]) =>
            parts
              .sort((a, b) => a.x - b.x)
              .map((q) => q.s)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          );

        let year: string | null = null;
        let grade: number | null = null;
        let current: { code: string; text: string; grade: number | null; year: string | null } | null =
          null;
        for (const line of visualLines) {
          const sm = line.match(SECTION);
          if (sm) {
            year = `${sm[1]}-${sm[2]}`;
            grade = Number(sm[3]);
            current = null;
            continue;
          }
          const first = line.split(" ")[0] ?? "";
          if (COURSE_CODE.test(first)) {
            if (current) {
              const row = toRow(current.code, current.text, current.grade, current.year);
              if (row) rows.push(row);
            }
            current = { code: first, text: line.slice(first.length).trim(), grade, year };
          } else if (current && !LABEL.test(line) && !CREDIT_NUMBER.test(line)) {
            // Wrapped continuation of the current course name.
            current.text += ` ${line}`;
          } else {
            if (current) {
              const row = toRow(current.code, current.text, current.grade, current.year);
              if (row) rows.push(row);
            }
            current = null;
          }
        }
        if (current) {
          const row = toRow(current.code, current.text, current.grade, current.year);
          if (row) rows.push(row);
        }
      }
    }

    return rows;
  } catch (err) {
    console.error("[transcript] pdf.js parse failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
