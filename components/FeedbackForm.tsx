"use client";

import { useState } from "react";
import { brand } from "@/config/brand";

const CATEGORIES = [
  "Wrong answer",
  "Missing info",
  "Suggestion",
  "Other",
] as const;

export function FeedbackForm() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "form",
          category,
          comment: comment.trim() || undefined,
          question: question.trim() || undefined,
        }),
      });
      setDone(true);
    } catch {
      // Even on error we thank the user — feedback is best-effort.
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-scarlet/20 bg-scarlet-tint p-8 text-center"
      >
        <p className="text-2xl">🦅</p>
        <h2 className="mt-2 text-xl font-bold text-ink">Thank you!</h2>
        <p className="mt-2 text-gray-700">
          Your feedback helps make {brand.name} more accurate and useful for
          every {brand.school.shortName} student.
        </p>
        <button
          type="button"
          onClick={() => {
            setComment("");
            setQuestion("");
            setCategory(CATEGORIES[0]);
            setDone(false);
          }}
          className="mt-6 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-ink hover:border-scarlet"
        >
          Send more feedback
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="fb-category"
          className="block text-sm font-semibold text-ink"
        >
          What kind of feedback?
        </label>
        <select
          id="fb-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-ink focus:border-scarlet"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="fb-question"
          className="block text-sm font-semibold text-ink"
        >
          What did you ask? <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="fb-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How many credits do I need to graduate?"
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-ink placeholder:text-gray-400 focus:border-scarlet"
        />
      </div>

      <div>
        <label
          htmlFor="fb-comment"
          className="block text-sm font-semibold text-ink"
        >
          Details
        </label>
        <textarea
          id="fb-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          placeholder="Tell us what was wrong, missing, or what you'd like to see…"
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-ink placeholder:text-gray-400 focus:border-scarlet"
        />
      </div>

      <p className="text-xs text-gray-500">
        Please don't include any personal information (names, student IDs, etc.).
        Feedback is used only to improve {brand.name}.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-scarlet px-6 py-3 font-semibold text-white transition hover:bg-scarlet/90 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}
