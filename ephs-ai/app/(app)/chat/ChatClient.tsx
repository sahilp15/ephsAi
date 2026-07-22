"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  CircleSlash,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
} from "lucide-react";
import clsx from "clsx";
import { useStudent } from "@/lib/client/student-context";
import { Markdown } from "@/components/Markdown";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const CHAT_KEY = "ephs-ai:chat:v1";
const MAX_TURNS_SENT = 16;

const SUGGESTIONS = [
  "What math courses can I take after Geometry?",
  "Which AP science courses can juniors take?",
  "Help me build a computer science pathway.",
  "Which graduation requirements am I missing?",
  "Compare AP Statistics and AP Calculus.",
  "Which clubs relate to engineering?",
];

export function ChatClient({
  aiConfigured,
  courseCount,
  guideTitle,
  pageCount,
}: {
  aiConfigured: boolean;
  courseCount: number;
  guideTitle: string;
  pageCount: number;
}) {
  const searchParams = useSearchParams();
  const { profile, plan } = useStudent();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hydrated = useRef(false);

  // Restore conversation, then apply a ?q= or ?about= prefill.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_KEY);
      if (raw) setMessages(JSON.parse(raw) as ChatMsg[]);
    } catch {
      /* ignore */
    }
    const q = searchParams.get("q");
    const about = searchParams.get("about");
    if (q) {
      setDraft(q);
    } else if (about) {
      setDraft(`Tell me about ${about}. Would it be a good fit for me?`);
    }
    hydrated.current = true;
    if (q || about) {
      window.setTimeout(() => textareaRef.current?.focus(), 40);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(messages.slice(-40)),
      );
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || streaming) return;
      setError(null);
      setDraft("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const history: ChatMsg[] = [
        ...messages,
        { role: "user", content: question },
      ];
      setMessages([...history, { role: "assistant", content: "" }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.slice(-MAX_TURNS_SENT),
            profile: {
              graduationYear: profile.graduationYear,
              currentGrade: profile.currentGrade,
              interests: profile.interests,
              careerIdeas: profile.careerIdeas,
              rigor: profile.rigor,
              apInterest: profile.apInterest,
              pathwayIds: profile.pathwayIds,
            },
            completedCourseIds: profile.completedCourseIds,
            plannedCourseIds: plan.map((p) => p.courseId),
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(body?.message ?? `Request failed (${res.status})`);
        }

        setMode(res.headers.get("X-Chat-Mode"));
        const reader = res.body?.getReader();
        if (!reader) throw new Error("The response stream was empty.");
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const current = acc;
          setMessages([
            ...history,
            { role: "assistant", content: current },
          ]);
        }
        acc += decoder.decode();
        if (!acc.trim()) {
          throw new Error("The assistant returned an empty reply.");
        }
        setMessages([...history, { role: "assistant", content: acc }]);
      } catch (err) {
        if (controller.signal.aborted) {
          // Keep whatever streamed before the user hit stop.
          setMessages((prev) =>
            prev[prev.length - 1]?.content === ""
              ? prev.slice(0, -1)
              : prev,
          );
        } else {
          setMessages(history);
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, plan, profile, streaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setMode(null);
    try {
      window.localStorage.removeItem(CHAT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const retry = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) send(lastUser.content);
  }, [messages, send]);

  const modeLabel = useMemo(() => {
    if (!aiConfigured || mode === "offline" || mode === "error") {
      return "Catalog lookup mode";
    }
    return "Live · grounded";
  }, [aiConfigured, mode]);

  const empty = messages.length === 0;
  const live = modeLabel === "Live · grounded";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ===== chat panel ===== */}
      <section
        aria-label="EPHS AI Assistant conversation"
        className="flex min-h-[72vh] flex-col overflow-hidden rounded-2xl border border-ep-border-soft bg-ep-card shadow-card"
      >
        {/* panel header */}
        <div className="flex items-center justify-between gap-3 border-b border-ep-border-soft px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ep-red text-white"
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ep-charcoal">
                EPHS AI Assistant
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-ep-muted">
                <span
                  aria-hidden
                  className={clsx(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    live ? "bg-ep-success" : "bg-ep-warn",
                  )}
                />
                {modeLabel} · {courseCount} courses · {pageCount} guide pages
              </p>
            </div>
          </div>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ep-muted transition-colors hover:bg-ep-bg-sunken hover:text-ep-charcoal"
            >
              <RefreshCw aria-hidden className="h-3.5 w-3.5" />
              New chat
            </button>
          ) : null}
        </div>

        {/* transcript */}
        <div className="scroll-quiet flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
          {empty ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-8 text-center">
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ep-red-soft text-ep-red"
              >
                <Sparkles className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ep-charcoal sm:text-3xl">
                Ask anything about courses at EPHS
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-ep-muted">
                Answers come only from the official {guideTitle}, with page
                citations — prerequisites, graduation rules, pathways, AP, and
                college credit are all in here.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-ep-border-soft bg-ep-card px-3.5 py-3 text-left text-[13px] leading-snug text-ep-ink transition-colors hover:border-ep-red/40 hover:bg-ep-red-soft hover:text-ep-red-dark"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {!profile.onboardingCompleted ? (
                <p className="mt-6 text-xs text-ep-faint">
                  Tip:{" "}
                  <Link
                    href="/onboarding"
                    className="font-semibold text-ep-red-dark underline underline-offset-2"
                  >
                    set up your profile
                  </Link>{" "}
                  so answers reflect your grade and completed courses.
                </p>
              ) : null}
            </div>
          ) : (
            messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isStreamingMsg =
                streaming && isLast && m.role === "assistant";
              return m.role === "user" ? (
                <div key={i} className="flex justify-end gap-2.5">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ep-charcoal px-4 py-2.5 text-sm leading-relaxed text-white sm:max-w-[70%]">
                    {m.content}
                  </div>
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ep-bg-sunken text-ep-muted"
                  >
                    <UserRound className="h-4 w-4" />
                  </span>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ep-red text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 max-w-[92%] pt-0.5 sm:max-w-[85%]">
                    {m.content === "" && isStreamingMsg ? (
                      <p
                        className="text-sm text-ep-faint"
                        role="status"
                        aria-label="The assistant is thinking"
                      >
                        Checking the course guide
                        <span className="stream-caret" />
                      </p>
                    ) : (
                      <div className={clsx(isStreamingMsg && "stream-caret")}>
                        <Markdown text={m.content} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {error ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-r-lg border-l-4 border-l-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={retry}
                className="shrink-0 rounded-md border border-ep-red/30 bg-ep-card px-2.5 py-1 text-xs font-semibold text-ep-red-dark hover:bg-ep-red-soft"
              >
                Retry
              </button>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form
          className="border-t border-ep-border-soft bg-ep-bg/50 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-ep-border bg-ep-card p-2 focus-within:border-ep-red">
            <label htmlFor="chat-input" className="sr-only">
              Ask the EPHS AI Assistant
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={draft}
              rows={1}
              maxLength={4000}
              placeholder="Ask about a course, requirement, or pathway"
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-ep-faint"
              data-focus-ring="custom"
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ep-charcoal text-white transition-colors hover:bg-ep-coal"
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ep-red text-white transition-colors hover:bg-ep-red-dark disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 px-1 text-[11px] text-ep-faint">
            Answers only from the 2026-27 guide · Enter to send, Shift + Enter
            for a new line · verify final decisions with your counselor.
          </p>
        </form>
      </section>

      {/* ===== side rail ===== */}
      <aside className="space-y-4 lg:pt-1" aria-label="About the assistant">
        <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
          <p className="kicker">Trained on EPHS only</p>
          <ul className="mt-3 space-y-3 text-[13px] leading-snug text-ep-muted">
            <li className="flex gap-2.5">
              <BookOpen aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ep-red" />
              <span>
                Every answer is drawn from the official {guideTitle} ({pageCount}{" "}
                pages, {courseCount} courses) and cites its pages.
              </span>
            </li>
            <li className="flex gap-2.5">
              <CircleSlash aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ep-red" />
              <span>
                If the guide does not contain something, the assistant says so
                instead of guessing. It will not answer for other schools.
              </span>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ep-red" />
              <span>
                Requests carry anonymized planning context only. Your name is
                never sent.
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
          <p className="kicker">Make it personal</p>
          <p className="mt-2 text-[13px] leading-snug text-ep-muted">
            {profile.onboardingCompleted ? (
              <>
                Your profile is active: grade {profile.currentGrade}, class of{" "}
                {profile.graduationYear}. Eligibility checks use your completed
                courses automatically.
              </>
            ) : (
              <>
                Add your grade, interests, and completed courses so the
                assistant can check eligibility for you.
              </>
            )}
          </p>
          <Link
            href={profile.onboardingCompleted ? "/dashboard" : "/onboarding"}
            className="mt-3 inline-block text-sm font-semibold text-ep-red-dark hover:text-ep-red"
          >
            {profile.onboardingCompleted ? "View dashboard" : "Set up profile"}{" "}
            &rarr;
          </Link>
        </div>
      </aside>
    </div>
  );
}
