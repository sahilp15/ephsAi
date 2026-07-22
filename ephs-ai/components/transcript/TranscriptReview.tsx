"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { MatchConfidence } from "@/lib/domain/transcript-match";

export interface ReviewRowInit {
  rowId?: string;
  rawName: string;
  originalCourseName: string;
  courseId: string | null;
  recordType: "completed" | "in_progress" | "transfer" | "repeat_needed" | "unmatched";
  gradeLevel: number | null;
  term: string | null;
  finalGrade: string | null;
  creditsEarned: number | null;
  isHonors: boolean;
  isAp: boolean;
  isTransfer: boolean;
  confidence: MatchConfidence | "confirmed";
}

interface ReviewRow extends ReviewRowInit {
  key: string;
  include: boolean;
  reviewed: boolean;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-ep-success-soft text-ep-success",
  possible: "bg-ep-warn-soft text-ep-warn",
  needs_review: "bg-ep-red-soft text-ep-red-dark",
  none: "bg-ep-red-soft text-ep-red-dark",
  confirmed: "bg-ep-success-soft text-ep-success",
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High confidence",
  possible: "Possible match",
  needs_review: "Needs review",
  none: "No match",
  confirmed: "Confirmed",
};

const RECORD_TYPES = [
  ["completed", "Completed"],
  ["in_progress", "In progress"],
  ["transfer", "Transfer"],
  ["repeat_needed", "Repeat needed"],
  ["unmatched", "Unmatched"],
] as const;

function isLowConfidence(c: string): boolean {
  return c === "needs_review" || c === "none" || c === "possible";
}

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `manual-${counter}`;
}

export interface ConfirmRow {
  rowId: string | null;
  include: boolean;
  courseId: string | null;
  originalCourseName: string;
  recordType: ReviewRowInit["recordType"];
  gradeLevel: number | null;
  term: string | null;
  finalGrade: string | null;
  creditsEarned: number | null;
  isHonors: boolean;
  isAp: boolean;
  isTransfer: boolean;
  confidence: string;
}

export function TranscriptReview({
  transcriptId,
  initialRows,
  catalog,
  warning,
  confirmUrl,
  redirectTo = "/plan?imported=1",
  onConfirm,
}: {
  transcriptId: string;
  initialRows: ReviewRowInit[];
  catalog: { id: string; title: string; department: string }[];
  warning?: string | null;
  /** Endpoint the confirmation POSTs to. Defaults to the authenticated route. */
  confirmUrl?: string;
  /** Where to send the student once their courses are saved. */
  redirectTo?: string;
  /**
   * Alternate confirmation handler. When provided it replaces the network
   * POST entirely - the no-login preview uses it to persist confirmed courses
   * in the browser instead of the database. Returns true on success.
   */
  onConfirm?: (rows: ConfirmRow[]) => Promise<boolean> | boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>(() =>
    initialRows.map((r, i) => ({
      ...r,
      key: `row-${i}`,
      include: r.confidence !== "none" ? true : Boolean(r.courseId),
      reviewed: !isLowConfidence(r.confidence),
    })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalogTitle = useMemo(() => new Map(catalog.map((c) => [c.id, c.title])), [catalog]);

  function update(key: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: nextKey(),
        rawName: "",
        originalCourseName: "",
        courseId: null,
        recordType: "completed",
        gradeLevel: 9,
        term: null,
        finalGrade: null,
        creditsEarned: null,
        isHonors: false,
        isAp: false,
        isTransfer: false,
        confidence: "confirmed",
        include: true,
        reviewed: true,
      },
    ]);
  }

  const unreviewed = rows.filter(
    (r) => r.include && isLowConfidence(r.confidence) && !r.reviewed,
  ).length;
  const includedCount = rows.filter((r) => r.include).length;
  const canConfirm = unreviewed === 0 && includedCount > 0 && !submitting;

  async function confirm() {
    setSubmitting(true);
    setError(null);
    const confirmRows: ConfirmRow[] = rows.map((r) => ({
      rowId: r.rowId ?? null,
      include: r.include,
      courseId: r.courseId,
      originalCourseName: r.originalCourseName || r.rawName || "Untitled course",
      recordType: r.recordType,
      gradeLevel: r.gradeLevel,
      term: r.term,
      finalGrade: r.finalGrade,
      creditsEarned: r.creditsEarned,
      isHonors: r.isHonors,
      isAp: r.isAp,
      isTransfer: r.isTransfer || (!r.courseId && r.recordType === "transfer"),
      confidence: r.confidence,
    }));

    let ok: boolean;
    if (onConfirm) {
      ok = await onConfirm(confirmRows);
    } else {
      const res = await fetch(confirmUrl ?? `/api/transcript/${transcriptId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: confirmRows }),
      });
      ok = res.ok;
    }
    if (!ok) {
      setError("We couldn't save your confirmation. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {warning ? (
        <div className="flex items-start gap-2 rounded-r-lg border-l-4 border-ep-warn bg-ep-warn-soft p-3 text-sm text-ep-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <span>{warning}</span>
        </div>
      ) : null}

      {unreviewed > 0 ? (
        <div className="rounded-r-lg border-l-4 border-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark">
          {unreviewed} course{unreviewed === 1 ? "" : "s"} need your review before you
          can confirm. Check the match, then tick <strong>Reviewed</strong>.
        </div>
      ) : null}

      <div className="space-y-3">
        {rows.map((r) => {
          const low = isLowConfidence(r.confidence);
          return (
            <div
              key={r.key}
              className={`rounded-xl border bg-ep-card p-3 shadow-card ${
                low && r.include && !r.reviewed ? "border-ep-red" : "border-ep-border-soft"
              } ${!r.include ? "opacity-55" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => update(r.key, { include: e.target.checked })}
                    className="h-4 w-4 accent-[#D8272E]"
                    aria-label="Include this course"
                  />
                  <span className="text-sm font-semibold text-ep-charcoal">
                    {r.rawName || "New course"}
                  </span>
                  <span
                    className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CONFIDENCE_STYLE[r.confidence] ?? "bg-ep-bg text-ep-muted"
                    }`}
                  >
                    {CONFIDENCE_LABEL[r.confidence] ?? r.confidence}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.key)}
                  className="text-ep-faint hover:text-ep-red-dark"
                  aria-label="Remove course"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-semibold text-ep-faint">
                  EPHS course match
                  <select
                    value={r.courseId ?? ""}
                    onChange={(e) => update(r.key, { courseId: e.target.value || null })}
                    className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal text-ep-charcoal outline-none focus:border-ep-red"
                  >
                    <option value="">— No match / transfer —</option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-ep-faint">
                  Type
                  <select
                    value={r.recordType}
                    onChange={(e) =>
                      update(r.key, { recordType: e.target.value as ReviewRow["recordType"] })
                    }
                    className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal text-ep-charcoal outline-none focus:border-ep-red"
                  >
                    {RECORD_TYPES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-ep-faint">
                  Grade level
                  <select
                    value={r.gradeLevel ?? ""}
                    onChange={(e) =>
                      update(r.key, { gradeLevel: e.target.value ? Number(e.target.value) : null })
                    }
                    className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal text-ep-charcoal outline-none focus:border-ep-red"
                  >
                    <option value="">—</option>
                    {[9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs font-semibold text-ep-faint">
                    Term
                    <input
                      value={r.term ?? ""}
                      onChange={(e) => update(r.key, { term: e.target.value || null })}
                      placeholder="S1"
                      className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal outline-none focus:border-ep-red"
                    />
                  </label>
                  <label className="text-xs font-semibold text-ep-faint">
                    Grade
                    <input
                      value={r.finalGrade ?? ""}
                      onChange={(e) => update(r.key, { finalGrade: e.target.value || null })}
                      placeholder="A"
                      className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal outline-none focus:border-ep-red"
                    />
                  </label>
                  <label className="text-xs font-semibold text-ep-faint">
                    Credits
                    <input
                      value={r.creditsEarned ?? ""}
                      onChange={(e) =>
                        update(r.key, {
                          creditsEarned: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="0.5"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm font-normal outline-none focus:border-ep-red"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ep-muted">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={r.isTransfer}
                    onChange={(e) => update(r.key, { isTransfer: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#D8272E]"
                  />
                  Transfer course
                </label>
                {r.courseId ? (
                  <span className="text-ep-faint">
                    Matched to: {catalogTitle.get(r.courseId)}
                  </span>
                ) : null}
                {low && r.include ? (
                  <label className="ml-auto flex items-center gap-1 font-semibold text-ep-red-dark">
                    <input
                      type="checkbox"
                      checked={r.reviewed}
                      onChange={(e) => update(r.key, { reviewed: e.target.checked })}
                      className="h-3.5 w-3.5 accent-[#D8272E]"
                    />
                    Reviewed
                  </label>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ep-border px-4 py-2 text-sm font-semibold text-ep-muted hover:border-ep-red/50 hover:text-ep-red-dark"
      >
        <Plus className="h-4 w-4" /> Add a missing course
      </button>

      {error ? (
        <div role="alert" className="rounded-r-lg border-l-4 border-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-ep-border-soft pt-4">
        <p className="text-sm text-ep-muted">
          {includedCount} course{includedCount === 1 ? "" : "s"} will be added to your history.
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={!canConfirm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Confirm &amp; update my plan
        </button>
      </div>
    </div>
  );
}
