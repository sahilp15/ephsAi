import { NextRequest, NextResponse } from "next/server";
import {
  buildChatSystemPrompt,
  offlineAnswer,
  trimmedHistory,
} from "@/lib/ai/chat";
import { streamChatCompletion } from "@/lib/ai/openai-provider";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { chatRequestSchema } from "@/lib/ai/schema";
import { aiEnabled, getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESPONSE_TOKENS = 1400;

function textResponse(
  body: string,
  mode: "offline" | "error",
  status = 200,
): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Chat-Mode": mode,
    },
  });
}

/**
 * POST /api/chat - the grounded EPHS assistant.
 *
 * Streams a plain-text (markdown) reply. Context is rebuilt from the
 * official course-guide dataset on every request, carries the current date,
 * and includes only anonymized planning context. Rate-limited per IP.
 */
export async function POST(request: NextRequest) {
  const env = getEnv();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limit = checkRateLimit(`chat:${ip}`, env.AI_RATE_LIMIT_PER_HOUR);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You have reached the hourly limit for the assistant. Please try again later; the catalog and planner remain fully available.",
        resetAt: limit.resetAt,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Request failed validation.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const req = parsed.data;

  if (!aiEnabled()) {
    return textResponse(offlineAnswer(req), "offline");
  }

  const system = buildChatSystemPrompt(req);
  const history = trimmedHistory(req.messages);
  const started = Date.now();

  let generator: AsyncGenerator<string, void, void>;
  try {
    generator = streamChatCompletion({
      system,
      messages: history,
      maxTokens: MAX_RESPONSE_TOKENS,
      signal: request.signal,
    });
    // Await the first chunk before committing to a streamed response so
    // connection/auth failures fall back to the offline answer cleanly.
    const first = await generator.next();

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!first.done && first.value) {
            controller.enqueue(encoder.encode(first.value));
          }
          for await (const delta of generator) {
            controller.enqueue(encoder.encode(delta));
          }
          console.info(`[chat] mode=ai ms=${Date.now() - started}`);
        } catch (err) {
          if (!request.signal.aborted) {
            console.error(
              "[chat] stream interrupted:",
              err instanceof Error ? err.message : err,
            );
            controller.enqueue(
              encoder.encode(
                "\n\nSorry, the connection dropped before I could finish. Please send that again.",
              ),
            );
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        void generator.return();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Chat-Mode": "ai",
        "X-Chat-Model": env.OPENAI_MODEL,
      },
    });
  } catch (err) {
    console.error(
      "[chat] provider error:",
      err instanceof Error ? err.message : err,
    );
    return textResponse(offlineAnswer(req), "error");
  }
}
