import "server-only";
import { getEnv } from "@/lib/env";
import { heuristicProvider } from "./heuristic-provider";
import { createOpenAIExtractionProvider } from "./openai-provider";
import type { TranscriptExtractionProvider } from "./types";

/**
 * Select the active extraction provider from configuration. The AI provider is
 * used only when explicitly selected and a key is present; otherwise the
 * no-external-calls heuristic provider handles the work. Swapping in a
 * different OCR/AI backend means adding one file and a case here.
 */
export function getExtractionProvider(): TranscriptExtractionProvider {
  const { TRANSCRIPT_EXTRACTION_PROVIDER, OPENAI_API_KEY } = getEnv();
  if (TRANSCRIPT_EXTRACTION_PROVIDER === "openai" && OPENAI_API_KEY) {
    return createOpenAIExtractionProvider();
  }
  return heuristicProvider;
}
