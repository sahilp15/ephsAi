import {
  Provider,
  GenerateOptions,
  RateLimitError,
} from "./provider";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Fallback provider: Groq (OpenAI-compatible chat completions endpoint).
 * Used automatically when Gemini is rate-limited and GROQ_API_KEY is set.
 */
export class GroqProvider implements Provider {
  readonly name = "groq";

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async *stream(opts: GenerateOptions): AsyncIterable<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const messages = [
      { role: "system", content: opts.systemInstruction },
      ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (res.status === 429) {
      throw new RateLimitError("Groq rate limited");
    }
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Groq request failed (${res.status}): ${detail}`);
    }

    // Parse the OpenAI-style Server-Sent Events stream.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // Ignore keep-alive / partial lines.
        }
      }
    }
  }
}
