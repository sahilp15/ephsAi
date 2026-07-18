import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import type {
  ExtractionInput,
  ExtractionResult,
  TranscriptExtractionProvider,
} from "./types";

/**
 * AI document-extraction provider (OpenAI vision). Used only when
 * TRANSCRIPT_EXTRACTION_PROVIDER=openai and OPENAI_API_KEY is set. Sends the
 * transcript image to a vision model and requests strict JSON, which is then
 * validated server-side before it is trusted. The rest of the app is decoupled
 * from this: it depends only on the TranscriptExtractionProvider interface.
 */

const rowSchema = z.object({
  rawCourseName: z.string().min(1),
  rawCourseCode: z.string().nullish(),
  schoolYear: z.string().nullish(),
  gradeLevel: z.number().int().min(6).max(12).nullish(),
  term: z.string().nullish(),
  finalGrade: z.string().nullish(),
  creditsAttempted: z.number().nullish(),
  creditsEarned: z.number().nullish(),
  courseLevel: z.string().nullish(),
  isHonors: z.boolean().optional().default(false),
  isAp: z.boolean().optional().default(false),
  inProgress: z.boolean().optional().default(false),
  isRepeat: z.boolean().optional().default(false),
  isIncomplete: z.boolean().optional().default(false),
  isTransfer: z.boolean().optional().default(false),
});

const responseSchema = z.object({ courses: z.array(rowSchema).max(200) });

const SYSTEM = `You extract structured course history from a high-school transcript image.
Return ONLY JSON: {"courses":[{...}]}. For each course row include, when visible:
rawCourseName, rawCourseCode, schoolYear (e.g. "2023-2024"), gradeLevel (9-12),
term (e.g. "S1","S2","T1"), finalGrade, creditsAttempted, creditsEarned, courseLevel,
and boolean flags isHonors, isAp, inProgress, isRepeat, isIncomplete, isTransfer.
Never invent courses or grades. Omit fields you cannot read (use null). Do not include commentary.`;

export function createOpenAIExtractionProvider(): TranscriptExtractionProvider {
  return {
    name: "openai",
    async extract(input: ExtractionInput): Promise<ExtractionResult> {
      const { OPENAI_API_KEY, OPENAI_MODEL } = getEnv();
      if (!OPENAI_API_KEY) {
        return {
          rows: [],
          provider: "openai",
          warnings: ["AI extraction is selected but OPENAI_API_KEY is not set."],
        };
      }
      const client = new OpenAI({ apiKey: OPENAI_API_KEY, timeout: 60_000, maxRetries: 1 });
      const dataUrl = `data:${input.mimeType};base64,${input.bytes.toString("base64")}`;

      const response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 3000,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the course history from this transcript." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? "";
      const parsed = responseSchema.safeParse(safeJson(text));
      if (!parsed.success) {
        return {
          rows: [],
          provider: "openai",
          warnings: ["The AI extractor returned data we couldn't validate. Please review or enter courses manually."],
        };
      }
      return { rows: parsed.data.courses, provider: "openai", warnings: [] };
    },
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
