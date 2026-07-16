"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import type { GradeYear, Term } from "@/lib/domain/plan-types";
import { GRADE_YEARS, TERMS } from "@/lib/domain/plan-types";

/** Accessible add-to-plan control used on course detail pages. */
export function AddToPlan({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { plan, addEntry, catalogMeta, metaReady } = useStudent();
  const [gradeYear, setGradeYear] = useState<GradeYear>(9);
  const [startTerm, setStartTerm] = useState<Term>(1);
  const [added, setAdded] = useState(false);

  const meta = catalogMeta.get(courseId);
  const alreadyPlanned = plan.some((e) => e.courseId === courseId);

  function handleAdd() {
    addEntry({
      courseId,
      gradeYear,
      startTerm,
      termSpan: meta?.termSpan ?? 1,
      status: "planned",
    });
    setAdded(true);
  }

  return (
    <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
      <h2 className="text-sm font-bold text-ep-charcoal">Add to my plan</h2>
      {alreadyPlanned && !added ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ep-muted">
          <CheckCircle2 aria-hidden className="h-4 w-4 text-ep-red" />
          Already in your plan.
        </p>
      ) : null}
      {added ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700" role="status">
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
              className="mt-1 rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm"
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
              className="mt-1 rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm"
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
            disabled={!metaReady}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark disabled:opacity-50"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add to plan
          </button>
        </div>
      )}
      {meta?.termSpan && meta.termSpan > 1 ? (
        <p className="mt-2 text-xs text-ep-muted">
          This course occupies {meta.termSpan} consecutive terms (
          {meta.termLabel}).
        </p>
      ) : null}
      {meta?.spanRequiresVerification ? (
        <p className="mt-2 text-xs text-ep-muted">
          Exact term placement must be confirmed with your counselor (
          {meta.termLabel}).
        </p>
      ) : null}
    </div>
  );
}
