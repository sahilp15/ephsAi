/**
 * AI provider abstraction. The recommendation pipeline depends only on this
 * interface, so the underlying model vendor can be swapped by adding another
 * implementation and changing one factory function.
 */

export interface CompletionRequest {
  system: string;
  user: string;
  /** Upper bound on generated tokens. */
  maxTokens: number;
  /** Abort when the client disconnects or the timeout fires. */
  signal?: AbortSignal;
}

export interface CompletionResult {
  /** Raw text the model returned (expected to be a JSON object). */
  text: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
