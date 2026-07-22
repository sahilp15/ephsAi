"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import type { GradeYear, Term } from "@/lib/domain/plan-types";
import { GRADE_YEARS, TERMS } from "@/lib/domain/plan-types";
import { addPlanEntryAction } from "@/app/(app)/plan/actions";

/**
 * Add-to-plan control used on course detail pages. Persists to the student's
 * saved plan through the RLS-protected server action; an unauthenticated
 * visitor is redirected to sign in by the action's `requireStudent` guard.
 */
export function AddToPlan({
  courseId,
  termSpan,
  termLabel,
  spanRequiresVerification,
}: {
  courseId: string;
  termSpan: number | null;
  termLabel: string;
  spanRequiresVerification: boolean;
}) {
  const router = useRouter();
  const [gradeYear, setGradeYear] = useState<GradeYear>(9);
  const [startTerm, setStartTerm] = useState<Term>(1);
  const [state, setState] = useState<"idle" | "saving" | "added" | "duplicate" | "error">("idle");

  async function handleAdd() {
    setState("saving");
    try {
      const res = await addPlanEntryAction({
        courseId,
        gradeYear,
        startTerm,
        termSpan: termSpan ?? 1,
        status: "planned",
        source: "student",
      });
      if (res.ok) setState("added");
      else setState(res.error === "duplicate" ? "duplicate" : "error");
    } catch {
      // A redirect (unauthenticated) throws here and navigation is handled by Next.
      setState("idle");
    }
  }

  return (
    <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
      <h2 className="text-sm font-bold text-ep-charcoal">Add to my plan</h2>
      {state === "duplicate" ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ep-muted">
          <CheckCircle2 aria-hidden className="h-4 w-4 text-ep-red" />
          Already in your plan.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-2 text-sm text-ep-red-dark">Couldn&apos;t add that course. Please try again.</p>
      ) : null}
      {state === "added" ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ep-success" role="status">
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          Added to your plan.{" "}
          <button
            type="button"
            onClick={() => router.push("/plan")}
            className="font-semibold text-ep-red-dark underline"
          >
            Open planner
          </button>
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="add-grade" className="block text-xs font-semibold text-ep-faint">
              Grade
            </label>
            <select
              id="add-grade"
              value={gradeYear}
              onChange={(e) => setGradeYear(Number(e.target.value) as GradeYear)}
              className="mt-1 rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm"
            >
              {GRADE_YEARS.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-term" className="block text-xs font-semibold text-ep-faint">
              Starting term
            </label>
            <select
              id="add-term"
              value={startTerm}
              onChange={(e) => setStartTerm(Number(e.target.value) as Term)}
              className="mt-1 rounded-lg border border-ep-border bg-ep-card px-2 py-1.5 text-sm"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  Term {t}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={state === "saving"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
          >
            {state === "saving" ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Plus aria-hidden className="h-4 w-4" />
            )}
            Add to plan
          </button>
        </div>
      )}
      {termSpan && termSpan > 1 ? (
        <p className="mt-2 text-xs text-ep-muted">
          This course occupies {termSpan} consecutive terms ({termLabel}).
        </p>
      ) : null}
      {spanRequiresVerification ? (
        <p className="mt-2 text-xs text-ep-muted">
          Exact term placement must be confirmed with your counselor ({termLabel}).
        </p>
      ) : null}
    </div>
  );
}
