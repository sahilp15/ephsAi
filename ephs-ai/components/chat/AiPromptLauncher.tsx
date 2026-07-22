"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import clsx from "clsx";

/**
 * Contextual AI entry point — adapts `@kokonutd/ai-input-with-suggestions`:
 * an autosizing prompt field with real EPHS suggestion chips beneath it.
 * Submitting hands off to the full assistant at `/chat?q=…` (prefilled draft),
 * so the existing streaming/grounding pipeline is untouched. Reused on the
 * dashboard, chat empty state, and course/pathway detail ("Ask about this…").
 */
export function AiPromptLauncher({
  suggestions,
  placeholder = "Ask about a course, requirement, or pathway…",
  tone = "light",
  className,
}: {
  suggestions: string[];
  placeholder?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    router.push(`/chat?q=${encodeURIComponent(question)}`);
  };

  const dark = tone === "dark";

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
        }}
        className={clsx(
          "flex items-end gap-2 rounded-xl border p-2 shadow-xs transition-colors focus-within:border-ep-red",
          dark
            ? "border-white/15 bg-white/5"
            : "border-ep-border bg-ep-card",
        )}
      >
        <Sparkles
          aria-hidden
          className={clsx("mb-2 ml-1.5 h-4 w-4 shrink-0", dark ? "text-ep-red" : "text-ep-red")}
        />
        <label htmlFor="ai-launcher" className="sr-only">
          Ask the EPHS AI Assistant
        </label>
        <textarea
          id="ai-launcher"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(value);
            }
          }}
          className={clsx(
            "max-h-36 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm leading-relaxed outline-none",
            dark
              ? "text-white placeholder:text-white/40"
              : "text-ep-charcoal placeholder:text-ep-faint",
          )}
          data-focus-ring="custom"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ep-red text-white transition-colors hover:bg-ep-red-dark disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Ask EPHS AI"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-left text-[13px] font-medium transition-colors",
                dark
                  ? "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:text-white"
                  : "border-ep-border bg-ep-card text-ep-ink hover:border-ep-red/40 hover:bg-ep-red-soft hover:text-ep-red-dark",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
