import "server-only";
import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import type { AIProvider, CompletionRequest, CompletionResult } from "./provider";

/**
 * OpenAI implementation of the AI provider. Server-only: the API key is read
 * from the environment and never reaches the browser. JSON mode is enforced
 * so responses can be strictly validated with Zod.
 */

const REQUEST_TIMEOUT_MS = 30_000;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const { OPENAI_API_KEY } = getEnv();
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return client;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const model = getEnv().OPENAI_MODEL;
    const response = await getClient().chat.completions.create(
      {
        model,
        response_format: { type: "json_object" },
        max_tokens: req.maxTokens,
        temperature: 0.2,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      },
      { signal: req.signal },
    );
    const text = response.choices[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty completion from model");
    return { text, model };
  }
}

/** Factory — swap providers here without touching the pipeline. */
export function getAIProvider(): AIProvider {
  return new OpenAIProvider();
}
