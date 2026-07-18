import "server-only";
import { parseTranscriptText } from "./parse";
import type {
  ExtractionInput,
  ExtractionResult,
  TranscriptExtractionProvider,
} from "./types";

/**
 * Built-in extraction provider that makes no external calls.
 *
 * For text-bearing PDFs and plain text it recovers readable text and runs the
 * deterministic parser. For scanned images (and image-only PDFs) it cannot OCR
 * on its own, so it returns no rows plus a clear warning — the student can then
 * add courses manually or an OCR/AI provider can be configured. This is the
 * "handle partially readable transcripts gracefully" path.
 */
export const heuristicProvider: TranscriptExtractionProvider = {
  name: "heuristic",
  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const warnings: string[] = [];
    const isImage = input.mimeType.startsWith("image/");
    const isPdf =
      input.mimeType === "application/pdf" ||
      input.filename.toLowerCase().endsWith(".pdf");

    if (isImage) {
      return {
        rows: [],
        provider: this.name,
        warnings: [
          "This looks like a scanned image. Automatic reading of images requires the AI extraction provider; you can add your courses manually below.",
        ],
      };
    }

    const text = recoverText(input.bytes);
    if (isPdf && text.replace(/\s/g, "").length < 40) {
      warnings.push(
        "We couldn't read much text from this PDF (it may be a scan). Please review carefully or add courses manually.",
      );
    }
    const rows = parseTranscriptText(text);
    if (rows.length === 0 && warnings.length === 0) {
      warnings.push(
        "No courses were detected automatically. You can add your completed courses manually.",
      );
    }
    return { rows, provider: this.name, warnings };
  },
};

/**
 * Best-effort text recovery from raw bytes. Handles UTF-8 text directly and
 * scrapes readable strings out of uncompressed PDF text objects. This is a
 * pragmatic fallback, not a full PDF engine — the AI provider is the path for
 * complex/scanned documents.
 */
function recoverText(bytes: Buffer): string {
  const raw = bytes.toString("latin1");
  // Pull text drawn with the PDF `Tj` / `TJ` operators: (text) Tj  or  [(a)(b)] TJ
  const chunks: string[] = [];
  const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  const tjArrayRegex = /\[((?:[^\][]|\\.)*)\]\s*TJ/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(raw))) chunks.push(unescapePdf(m[1]!));
  while ((m = tjArrayRegex.exec(raw))) {
    const inner = m[1]!;
    const parts = inner.match(/\(((?:[^()\\]|\\.)*)\)/g) ?? [];
    chunks.push(parts.map((p) => unescapePdf(p.slice(1, -1))).join(""));
  }
  if (chunks.length > 0) {
    // Reconstruct rough lines from drawn text runs.
    return chunks.join("\n");
  }
  // Not a PDF text stream — treat as plain text if it is mostly printable.
  const printable = raw.replace(/[^\x20-\x7e\n\r\t]/g, "");
  if (printable.length / Math.max(1, raw.length) > 0.6) return printable;
  return "";
}

function unescapePdf(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
