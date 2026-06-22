/** A single conversation turn passed to a provider. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  /** Full system instruction (system prompt + knowledge context). */
  systemInstruction: string;
  /** Recent conversation turns (oldest first). The last turn is the new user message. */
  messages: ChatTurn[];
}

/** Error subclass that lets us detect rate limits for fallback handling. */
export class RateLimitError extends Error {
  constructor(message = "rate limited") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * A pluggable AI provider. Implementations stream the answer as text chunks.
 * The provider/model is selected in `lib/ai/index.ts`, so swapping providers is
 * a one-file change.
 */
export interface Provider {
  /** Human-readable name, e.g. "gemini" or "groq". */
  readonly name: string;
  /** Whether this provider is configured (has an API key). */
  isConfigured(): boolean;
  /** Stream a completion as an async iterable of text chunks. */
  stream(opts: GenerateOptions): AsyncIterable<string>;
}
