import {
  Provider,
  GenerateOptions,
  RateLimitError,
  ChatTurn,
} from "./provider";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

export type { ChatTurn, GenerateOptions };

/**
 * Provider wiring lives here so swapping providers is a single-file change.
 *
 * Primary: Gemini. Fallback: Groq.
 */
export const primaryProvider: Provider = new GeminiProvider();
export const fallbackProvider: Provider = new GroqProvider();

/** Friendly message shown when everything is rate-limited / unavailable. */
export const BUSY_MESSAGE =
  "I'm a bit busy right now — please try again in a moment. If it keeps happening, you can always reach out to the EPHS counseling office directly.";

/**
 * Generate a streamed answer with built-in resilience:
 *   1. Try the primary provider (Gemini).
 *   2. On a rate limit, retry the primary ONCE.
 *   3. If still rate-limited and the fallback (Groq) is configured, use it.
 *   4. Otherwise, stream the friendly BUSY_MESSAGE.
 *
 * Never throws for provider/rate-limit issues — the UI must not crash.
 */
export async function* generateAnswer(
  opts: GenerateOptions,
): AsyncIterable<string> {
  // Attempt 1: primary
  try {
    yield* primaryProvider.stream(opts);
    return;
  } catch (err) {
    if (!(err instanceof RateLimitError)) {
      // Non-rate-limit error: log and fail soft.
      console.error(`[ai] ${primaryProvider.name} error:`, err);
      yield BUSY_MESSAGE;
      return;
    }
    console.warn(`[ai] ${primaryProvider.name} rate-limited; retrying once.`);
  }

  // Attempt 2: retry primary once
  try {
    yield* primaryProvider.stream(opts);
    return;
  } catch (err) {
    if (!(err instanceof RateLimitError)) {
      console.error(`[ai] ${primaryProvider.name} retry error:`, err);
      yield BUSY_MESSAGE;
      return;
    }
    console.warn(`[ai] ${primaryProvider.name} still rate-limited.`);
  }

  // Attempt 3: fallback provider, if configured
  if (fallbackProvider.isConfigured()) {
    try {
      console.warn(`[ai] falling back to ${fallbackProvider.name}.`);
      yield* fallbackProvider.stream(opts);
      return;
    } catch (err) {
      console.error(`[ai] ${fallbackProvider.name} error:`, err);
    }
  }

  // Everything exhausted: fail soft.
  yield BUSY_MESSAGE;
}
