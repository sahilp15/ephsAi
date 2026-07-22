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
  "What clubs are good for someone interested in engineering?",
  "I want to become a nurse. Which EPHS courses and clubs should I look at?",
  "How many classes can I take in one term?",
  "Which clubs meet on Tuesdays?",
  "Build me a four-year plan with clubs too",
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

  // Restore conversation, then apply an ?about= prefill from a course page.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_KEY);
      if (raw) setMessages(JSON.parse(raw) as ChatMsg[]);
    } catch {
      /* ignore */
    }
    const about = searchParams.get("about");
    if (about) {
      setDraft(`Tell me about ${about}. Would it be a good fit for me?`);
    }
    hydrated.current = true;
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

  const modeLabel = useMemo(() => {
    if (!aiConfigured || mode === "offline" || mode === "error") {
      return "Catalog lookup mode";
    }
    return "Live · grounded";
  }, [aiConfigured, mode]);

  const empty = messages.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      {/* ===== chat panel ===== */}
      <section
        aria-label="EPHS AI Assistant conversation"
        className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-ep-border-soft bg-white shadow-card"
      >
        {/* panel header */}
        <div className="flex items-center justify-between gap-3 border-b border-ep-border-soft bg-ep-coal px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-11 -skew-x-12 items-center justify-center rounded-[3px] bg-ep-red"
            >
              <span className="skew-x-12 font-display text-lg font-bold">EP</span>
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-bold uppercase tracking-wide">
                EPHS AI Assistant
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                {modeLabel} · {courseCount} courses · {pageCount} guide pages
              </p>
            </div>
          </div>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw aria-hidden className="h-3.5 w-3.5" />
              New chat
            </button>
          ) : null}
        </div>

        {/* transcript */}
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="wing-stripes" aria-hidden>
                <i /><i /><i />
              </span>
              <h1 className="mt-4 max-w-md text-3xl font-bold leading-none text-ep-charcoal sm:text-4xl">
                Ask anything about courses at EPHS
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ep-muted">
                Answers come only from the official {guideTitle}, with page
                citations. Prerequisites, graduation rules, pathways, AP and
                college credit: it is all in here.
              </p>
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg border border-ep-border bg-ep-bg px-3.5 py-3 text-left text-[13px] leading-snug text-ep-ink transition-colors hover:border-ep-red hover:bg-white hover:text-ep-red-dark"
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
                    className="font-semibold text-ep-red-dark underline"
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
                  <div className="max-w-[85%] rounded-xl rounded-br-sm bg-ep-coal px-4 py-2.5 text-sm leading-relaxed text-white sm:max-w-[70%]">
                    {m.content}
                  </div>
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ep-border-soft text-ep-muted"
                  >
                    <UserRound className="h-4 w-4" />
                  </span>
                </div>
              ) : (
                <div key={i} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-8 shrink-0 -skew-x-12 items-center justify-center rounded-[3px] bg-ep-red"
                  >
                    <span className="skew-x-12 font-display text-xs font-bold text-white">
                      EP
                    </span>
                  </span>
                  <div className="max-w-[92%] sm:max-w-[80%]">
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
              className="rounded-r-lg border-l-4 border-l-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark"
            >
              {error}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form
          className="border-t border-ep-border-soft bg-ep-bg/60 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="flex items-end gap-2 rounded-lg border border-ep-border bg-white p-2 focus-within:border-ep-red">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ep-coal text-white transition-colors hover:bg-ep-charcoal"
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ep-red text-white transition-colors hover:bg-ep-red-dark disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ep-faint">
            Answers only from the 2026-27 guide · verify final decisions with
            your counselor
          </p>
        </form>
      </section>

      {/* ===== side rail ===== */}
      <aside className="space-y-4 lg:pt-1" aria-label="About the assistant">
        <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
          <p className="kicker text-ep-red">Trained on EPHS only</p>
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
        <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
          <p className="kicker text-ep-red">Make it personal</p>
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
            className="mt-3 inline-block font-display text-sm font-bold uppercase tracking-wider text-ep-red-dark hover:text-ep-red"
          >
            {profile.onboardingCompleted ? "View dashboard" : "Set up profile"}{" "}
            &rarr;
          </Link>
        </div>
      </aside>
    </div>
  );
}
