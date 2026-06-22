/**
 * Pluggable feedback persistence.
 *
 * Default behavior:
 *   - If Vercel KV env vars (KV_REST_API_URL + KV_REST_API_TOKEN) exist,
 *     feedback is written to KV.
 *   - Otherwise, a no-op stub logs to the server console.
 *
 * IMPORTANT: feedback payloads must NEVER contain personal data (no names,
 * emails, IDs, grades, etc.). See FeedbackPayload below.
 */

export type FeedbackKind = "thumb" | "form";

export interface FeedbackPayload {
  kind: FeedbackKind;
  /** For thumb feedback: was it positive? */
  rating?: "up" | "down";
  /** Form category (Wrong answer / Missing info / Suggestion / Other). */
  category?: string;
  /** Free-text comment (what was wrong/missing). No PII. */
  comment?: string;
  /** Optional "what did you ask?" context. No PII. */
  question?: string;
  /** ISO timestamp, set server-side. */
  timestamp: string;
}

export interface FeedbackAdapter {
  readonly name: string;
  save(payload: FeedbackPayload): Promise<void>;
}

/** No-op adapter: logs feedback to the server console. */
class StubAdapter implements FeedbackAdapter {
  readonly name = "console-stub";
  async save(payload: FeedbackPayload): Promise<void> {
    // Documented no-op: nothing is persisted; this is expected without KV.
    console.log("[feedback:stub] (not persisted)", JSON.stringify(payload));
  }
}

/** Vercel KV adapter: appends feedback to a capped list via the REST API. */
class KvAdapter implements FeedbackAdapter {
  readonly name = "vercel-kv";
  constructor(
    private url: string,
    private token: string,
  ) {}

  async save(payload: FeedbackPayload): Promise<void> {
    // Use the KV REST API directly (no extra dependency). RPUSH onto a list.
    const res = await fetch(`${this.url}/rpush/eddy:feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(payload)),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`KV save failed (${res.status}): ${detail}`);
    }
  }
}

let adapter: FeedbackAdapter | null = null;

/** Select the adapter once, based on env. */
export function getFeedbackAdapter(): FeedbackAdapter {
  if (adapter) return adapter;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  adapter = url && token ? new KvAdapter(url, token) : new StubAdapter();
  return adapter;
}

/** Strip any unexpected/PII-ish fields and cap lengths before saving. */
export function sanitizeFeedback(
  input: Partial<FeedbackPayload>,
): FeedbackPayload {
  const cap = (s: unknown, n: number) =>
    typeof s === "string" ? s.slice(0, n) : undefined;
  return {
    kind: input.kind === "form" ? "form" : "thumb",
    rating: input.rating === "up" || input.rating === "down" ? input.rating : undefined,
    category: cap(input.category, 60),
    comment: cap(input.comment, 2000),
    question: cap(input.question, 2000),
    timestamp: new Date().toISOString(),
  };
}
