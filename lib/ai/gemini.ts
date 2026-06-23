import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Provider,
  GenerateOptions,
  RateLimitError,
} from "./provider";

const DEFAULT_MODEL = "gemini-2.5-flash";

/** Primary provider: Google Gemini (free tier). */
export class GeminiProvider implements Provider {
  readonly name = "gemini";

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async *stream(opts: GenerateOptions): AsyncIterable<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: opts.systemInstruction,
    });

    // Map our turns to Gemini's history format. The final user message is sent
    // via sendMessageStream; everything before it is history.
    let history = opts.messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Gemini requires history to START with a user turn. Drop any leading
    // assistant/model turns (e.g. the assistant's welcome message).
    while (history.length > 0 && history[0].role !== "user") {
      history = history.slice(1);
    }

    const last = opts.messages[opts.messages.length - 1];

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(last?.content ?? "");
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    } catch (err) {
      throw normalizeError(err);
    }
  }
}

/** Detect 429 / rate-limit / quota errors and surface them as RateLimitError. */
function normalizeError(err: unknown): Error {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const status = (err as { status?: number })?.status;
  if (
    status === 429 ||
    /429|rate.?limit|quota|resource.?exhausted|too many requests/i.test(msg)
  ) {
    return new RateLimitError(msg || "Gemini rate limited");
  }
  return err instanceof Error ? err : new Error(String(err));
}
