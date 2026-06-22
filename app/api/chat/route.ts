import { NextRequest } from "next/server";
import {
  loadKnowledge,
  buildKnowledgeContext,
  collectSourceUrls,
} from "@/lib/knowledge";
import { selectRelevant } from "@/lib/retrieve";
import { buildSystemInstruction } from "@/lib/prompt";
import { generateAnswer, type ChatTurn } from "@/lib/ai";

// Runs on the Node.js runtime (filesystem access for the knowledge loader).
export const runtime = "nodejs";

// Keep only the most recent turns to bound the request size.
const MAX_TURNS = 12;

export async function POST(req: NextRequest) {
  let body: { messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const recent = messages.slice(-MAX_TURNS).filter(
    (m): m is ChatTurn =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );

  if (recent.length === 0 || recent[recent.length - 1].role !== "user") {
    return new Response("A user message is required", { status: 400 });
  }

  const latestUser = recent[recent.length - 1].content;

  // Build grounding context (direct injection; retrieve stub returns all files).
  const allEntries = loadKnowledge();
  const relevant = selectRelevant(latestUser, allEntries);
  const knowledgeContext = buildKnowledgeContext(relevant);
  const systemInstruction = buildSystemInstruction(knowledgeContext);
  const sources = collectSourceUrls(relevant);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of generateAnswer({
          systemInstruction,
          messages: recent.filter((m) => !("id" in m) || m.id !== "welcome"),
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        // generateAnswer already fails soft, but guard the stream regardless.
        console.error("[api/chat] stream error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\nSorry — something went wrong on my end. Please try again.",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // Source URLs travel in a header so the UI can render the "Sources" row.
      "X-Eddy-Sources": JSON.stringify(sources),
    },
  });
}
