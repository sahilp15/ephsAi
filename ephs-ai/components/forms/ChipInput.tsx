"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

/**
 * Accessible tag/chip input. Enter or comma adds a value; Backspace on an empty
 * field removes the last. Used across onboarding, the profile page, and manual
 * course entry.
 */
export function ChipInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions = [],
  id,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();

  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  const remaining = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-ep-charcoal">
        {label}
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md border border-ep-border bg-white p-1.5 focus-within:border-ep-red">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-[3px] bg-ep-red-soft px-2 py-0.5 text-xs font-semibold text-ep-red-dark"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-ep-red-dark/70 hover:text-ep-red-dark"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(draft)}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 border-none bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      {remaining.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-ep-border bg-ep-bg px-2.5 py-0.5 text-xs text-ep-muted hover:border-ep-red/40 hover:text-ep-red-dark"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
