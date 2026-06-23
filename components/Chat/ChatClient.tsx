"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { brand } from "@/config/brand";
import {
  welcomeMessage,
  suggestedPrompts,
  quickActions,
} from "@/config/content";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  sources?: string[];
  /** True once streaming for this message has finished. */
  done?: boolean;
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: welcomeMessage, done: true },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSentRef = useRef(false);

  // Auto-scroll to the latest message.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setError(null);

      const userMsg: Message = { id: newId(), role: "user", content: trimmed };
      const assistantId = newId();
      const history = [...messages, userMsg];

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", done: false },
      ]);
      setInput("");
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }

        // Sources come back in a header.
        let sources: string[] = [];
        try {
          sources = JSON.parse(res.headers.get("X-Knowledge-Sources") ?? "[]");
        } catch {
          sources = [];
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: acc } : m,
            ),
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, sources, done: true } : m,
          ),
        );
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong reaching the assistant. Please check your connection and try again.",
        );
        // Drop the empty assistant bubble on hard failure.
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [messages, isStreaming],
  );

  // Deep-link support: if the page is opened with ?prompt=... (from the landing
  // quick actions), auto-send that question once on first load.
  useEffect(() => {
    if (autoSentRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
    if (prompt && prompt.trim()) {
      autoSentRef.current = true;
      void send(prompt);
    }
  }, [send]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const showSuggestions = messages.length === 1 && !isStreaming;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col px-3 sm:px-4">
      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${brand.shortName}`}
        className="flex-1 space-y-4 overflow-y-auto py-4"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isStreaming={isStreaming}
          />
        ))}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-scarlet-tint px-4 py-3 text-sm text-scarlet"
          >
            {error}
          </p>
        )}
      </div>

      {/* Suggested prompts (first load only) */}
      {showSuggestions && (
        <div className="pb-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Try asking…
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void send(p)}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-left text-sm text-ink transition hover:border-scarlet hover:bg-scarlet-tint"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => void send(a.prompt)}
              disabled={isStreaming}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-scarlet hover:bg-scarlet-tint disabled:opacity-40"
            >
              <span aria-hidden="true">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="border-t border-gray-100 pt-3 pb-2">
        <label htmlFor="chat-input" className="sr-only">
          Ask {brand.name} a question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={`Ask ${brand.name} anything about EPHS…`}
            className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-base text-ink placeholder:text-gray-400 focus:border-scarlet"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="h-11 shrink-0 rounded-full bg-scarlet px-5 font-semibold text-white transition hover:bg-scarlet/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">
          {brand.name} can make mistakes and isn't an official {brand.school.shortName} source.
          Don't share personal info. Confirm important decisions with your counselor.
        </p>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const isEmptyStreaming =
    !isUser && !message.done && message.content.length === 0;

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-scarlet text-white"
            : "bg-gray-50 text-ink ring-1 ring-gray-100"
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-scarlet">
            {brand.shortName}
          </p>
        )}

        {isEmptyStreaming ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.content}
          </p>
        )}

        {message.done && !isUser && message.sources && message.sources.length > 0 && (
          <Sources urls={message.sources} />
        )}

        {message.done && !isUser && message.id !== "welcome" && (
          <ThumbFeedback question={message.content} />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="eddy-dot h-2 w-2 rounded-full bg-scarlet" />
      <span
        className="eddy-dot h-2 w-2 rounded-full bg-scarlet"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="eddy-dot h-2 w-2 rounded-full bg-scarlet"
        style={{ animationDelay: "0.3s" }}
      />
    </span>
  );
}

function Sources({ urls }: { urls: string[] }) {
  return (
    <div className="mt-3 border-t border-gray-200 pt-2">
      <p className="text-xs font-semibold text-gray-500">Sources</p>
      <ul className="mt-1 space-y-1">
        {urls.map((u) => (
          <li key={u}>
            <a
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs text-scarlet underline hover:no-underline"
            >
              {u} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThumbFeedback({ question }: { question: string }) {
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const post = (rating: "up" | "down", text?: string) => {
    void fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "thumb",
        rating,
        comment: text,
        // We send the answer snippet only for context; it contains no PII.
        question: undefined,
      }),
    }).catch(() => {});
  };

  const onThumb = (rating: "up" | "down") => {
    setRated(rating);
    if (rating === "up") {
      post("up");
      setSent(true);
    } else {
      setShowComment(true);
    }
  };

  const submitComment = () => {
    post("down", comment.trim() || undefined);
    setShowComment(false);
    setSent(true);
  };

  if (sent) {
    return (
      <p className="mt-2 text-xs text-gray-400">Thanks for the feedback!</p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Was this helpful?</span>
        <button
          type="button"
          aria-label="Helpful"
          aria-pressed={rated === "up"}
          onClick={() => onThumb("up")}
          className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
        >
          👍
        </button>
        <button
          type="button"
          aria-label="Not helpful"
          aria-pressed={rated === "down"}
          onClick={() => onThumb("down")}
          className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
        >
          👎
        </button>
      </div>

      {showComment && (
        <div className="flex flex-col gap-2">
          <label htmlFor="fb-comment" className="sr-only">
            What was missing or wrong?
          </label>
          <textarea
            id="fb-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="What was missing or wrong? (optional — no personal info)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-scarlet"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitComment}
              className="rounded-full bg-scarlet px-3 py-1.5 text-xs font-semibold text-white hover:bg-scarlet/90"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={() => {
                post("down");
                setShowComment(false);
                setSent(true);
              }}
              className="rounded-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
