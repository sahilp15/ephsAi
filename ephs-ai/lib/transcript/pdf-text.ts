import "server-only";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { ExtractedCourseRow, TranscriptMeta } from "./types";
import { parseTranscriptColumns, type TranscriptParseResult } from "./transcript-layout";

export type { TranscriptParseResult };

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
 * This module is only responsible for turning a PDF into ordered visual lines.
 * Interpreting those lines (sections, in-progress block, current grade) lives
 * in `transcript-layout.ts`, which is pure and unit tested.
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

/**
 * Read a transcript PDF into ordered visual lines, one array per page column.
 * Returns null when the document can't be read as text.
 */
async function readColumns(bytes: Buffer): Promise<string[][] | null> {
  let pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    // Load pdf.js at runtime via a non-analyzable dynamic import so webpack
    // never tries to bundle or resolve this server-only, ESM-only package at
    // build time (which otherwise fails the Next build). Node resolves it from
    // node_modules when the route actually runs.
    const runtimeImport = new Function("s", "return import(s)") as (
      s: string,
    ) => Promise<unknown>;
    pdfjs = (await runtimeImport(
      "pdfjs-dist/legacy/build/pdf.mjs",
    )) as typeof import("pdfjs-dist/legacy/build/pdf.mjs");
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
    console.error(
      "[transcript] pdf.js unavailable, falling back to raw text:",
      err instanceof Error ? err.message : err,
    );
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

    const allColumns: string[][] = [];
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
        allColumns.push(
          [...byRow.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([, parts]) =>
              parts
                .sort((a, b) => a.x - b.x)
                .map((q) => q.s)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim(),
            ),
        );
      }
    }

    return allColumns;
  } catch (err) {
    console.error("[transcript] pdf.js parse failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Extract structured course rows plus document meta (current grade, current
 * school year) from a text-based transcript PDF. Returns null when the document
 * can't be read as text, so the caller can fall back to the raw-text reader.
 */
export async function extractPdfTranscript(
  bytes: Buffer,
): Promise<TranscriptParseResult | null> {
  const columns = await readColumns(bytes);
  if (!columns) return null;
  return parseTranscriptColumns(columns);
}

/**
 * Row-only view of {@link extractPdfTranscript}, kept for callers that do not
 * need the document meta.
 */
export async function extractPdfCourseRows(
  bytes: Buffer,
): Promise<ExtractedCourseRow[] | null> {
  const result = await extractPdfTranscript(bytes);
  return result ? result.rows : null;
}

export type { TranscriptMeta };
