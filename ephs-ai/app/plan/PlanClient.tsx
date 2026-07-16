"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import { useStudent } from "@/lib/client/student-context";
import { validatePlan, type PlanWarning } from "@/lib/domain/plan-validation";
import type {
  CourseMeta,
  GradeYear,
  PlanEntry,
  Term,
} from "@/lib/domain/plan-types";
import { GRADE_YEARS, TERMS } from "@/lib/domain/plan-types";
import {
  CounselorVerificationNotice,
  EmptyState,
  WarningBanner,
} from "@/components/ui";
import clsx from "clsx";

const STATUS_STYLES: Record<PlanEntry["status"], string> = {
  planned: "border-ep-border-soft bg-white",
  completed: "border-emerald-200 bg-emerald-50",
  considering: "border-dashed border-ep-border bg-ep-bg",
};

function CoursePicker({
  catalog,
  onAdd,
}: {
  catalog: CourseMeta[];
  onAdd: (meta: CourseMeta, gradeYear: GradeYear, startTerm: Term) => void;
}) {
  const [query, setQuery] = useState("");
  const [gradeYear, setGradeYear] = useState<GradeYear>(9);
  const [startTerm, setStartTerm] = useState<Term>(1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalog
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalog, query]);

  return (
    <div className="no-print rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
      <h2 className="text-sm font-bold text-ep-charcoal">Add a course</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="picker-q" className="block text-xs font-semibold text-ep-faint">
            Course title
          </label>
          <input
            id="picker-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing a title…"
            className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="picker-grade" className="block text-xs font-semibold text-ep-faint">
            Grade
          </label>
          <select
            id="picker-grade"
            value={gradeYear}
            onChange={(e) => setGradeYear(Number(e.target.value) as GradeYear)}
            className="mt-1 rounded-md border border-ep-border bg-white px-2 py-2 text-sm"
          >
            {GRADE_YEARS.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="picker-term" className="block text-xs font-semibold text-ep-faint">
            Start term
          </label>
          <select
            id="picker-term"
            value={startTerm}
            onChange={(e) => setStartTerm(Number(e.target.value) as Term)}
            className="mt-1 rounded-md border border-ep-border bg-white px-2 py-2 text-sm"
          >
            {TERMS.map((t) => (
              <option key={t} value={t}>
                Term {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {matches.length > 0 ? (
        <ul className="mt-3 divide-y divide-ep-border-soft rounded-md border border-ep-border">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 p-2 text-sm">
              <span>
                <span className="font-medium text-ep-charcoal">{m.title}</span>{" "}
                <span className="text-xs text-ep-muted">
                  · {m.department} · grades {m.grades.join(", ")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onAdd(m, gradeYear, startTerm);
                  setQuery("");
                }}
                className="shrink-0 rounded-md bg-ep-red px-3 py-1 text-xs font-semibold text-white hover:bg-ep-red-dark"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EntryCard({
  entry,
  meta,
  warnings,
  onUpdate,
  onRemove,
}: {
  entry: PlanEntry;
  meta: CourseMeta | undefined;
  warnings: PlanWarning[];
  onUpdate: (patch: Partial<PlanEntry>) => void;
  onRemove: () => void;
}) {
  const hasError = warnings.some((w) => w.severity === "error");
  const hasWarning = warnings.some((w) => w.severity === "warning");
  return (
    <div
      className={clsx(
        "rounded-lg border p-2.5 text-sm shadow-card",
        STATUS_STYLES[entry.status],
        hasError && "ring-1 ring-ep-red",
        !hasError && hasWarning && "ring-1 ring-amber-400",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/courses/${entry.courseId}`}
          className="font-semibold leading-snug text-ep-charcoal hover:text-ep-red-dark"
        >
          {meta?.title ?? entry.courseId}
        </Link>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${meta?.title ?? entry.courseId} from plan`}
          className="no-print rounded p-1 text-ep-faint hover:bg-ep-bg hover:text-ep-red-dark"
        >
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
      {entry.termSpan > 1 ? (
        <p className="mt-0.5 text-xs text-ep-muted">
          Terms {entry.startTerm}–{Math.min(4, entry.startTerm + entry.termSpan - 1)}
        </p>
      ) : null}
      {hasError || hasWarning ? (
        <p className={clsx("mt-1 text-xs font-medium", hasError ? "text-ep-red-dark" : "text-amber-700")}>
          {(warnings.find((w) => w.severity === "error") ?? warnings.find((w) => w.severity === "warning"))?.title}
        </p>
      ) : null}
      <div className="no-print mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <label className="sr-only" htmlFor={`status-${entry.id}`}>
          Status for {meta?.title ?? entry.courseId}
        </label>
        <select
          id={`status-${entry.id}`}
          value={entry.status}
          onChange={(e) => onUpdate({ status: e.target.value as PlanEntry["status"] })}
          className="rounded border border-ep-border bg-white px-1.5 py-0.5"
        >
          <option value="planned">Planned</option>
          <option value="completed">Completed</option>
          <option value="considering">Considering</option>
        </select>
        <label className="sr-only" htmlFor={`move-${entry.id}`}>
          Move {meta?.title ?? entry.courseId}
        </label>
        <select
          id={`move-${entry.id}`}
          value={`${entry.gradeYear}-${entry.startTerm}`}
          onChange={(e) => {
            const [g, t] = e.target.value.split("-").map(Number);
            onUpdate({ gradeYear: g as GradeYear, startTerm: t as Term });
          }}
          className="rounded border border-ep-border bg-white px-1.5 py-0.5"
        >
          {GRADE_YEARS.flatMap((g) =>
            TERMS.map((t) => (
              <option key={`${g}-${t}`} value={`${g}-${t}`}>
                Gr {g} · T{t}
              </option>
            )),
          )}
        </select>
      </div>
    </div>
  );
}

export function PlanClient() {
  const {
    profile,
    plan,
    ready,
    metaReady,
    catalogMeta,
    catalogList,
    addEntry,
    updateEntry,
    removeEntry,
  } = useStudent();

  const warnings = useMemo(
    () =>
      validatePlan({
        entries: plan,
        profile: {
          graduationYear: profile.graduationYear,
          currentGrade: profile.currentGrade,
          completedCourseIds: profile.completedCourseIds,
        },
        catalog: catalogMeta,
      }),
    [plan, profile, catalogMeta],
  );

  const warningsByEntry = useMemo(() => {
    const map = new Map<string, PlanWarning[]>();
    for (const w of warnings) {
      if (!w.entryId) continue;
      const list = map.get(w.entryId) ?? [];
      list.push(w);
      map.set(w.entryId, list);
    }
    return map;
  }, [warnings]);

  if (!ready || !metaReady) {
    return (
      <p role="status" className="text-sm text-ep-muted">
        Loading your plan…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ep-charcoal">
            Four-Year Plan
          </h1>
          <p className="mt-1 text-sm text-ep-muted">
            EPHS uses a four-term school year. Validation runs automatically
            after every change.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-white px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
        >
          <Printer aria-hidden className="h-4 w-4" />
          Print / export summary
        </button>
      </div>

      <CoursePicker
        catalog={catalogList}
        onAdd={(meta, gradeYear, startTerm) =>
          addEntry({
            courseId: meta.id,
            gradeYear,
            startTerm,
            termSpan: meta.termSpan ?? 1,
            status: "planned",
          })
        }
      />

      {plan.length === 0 ? (
        <EmptyState
          title="Your plan is empty"
          action={
            <Link
              href="/courses"
              className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
            >
              Browse the catalog
            </Link>
          }
        >
          Add courses above, from the catalog, or load a demo student from the
          counselor view.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {GRADE_YEARS.map((grade) => {
            const gradeEntries = plan.filter((e) => e.gradeYear === grade);
            return (
              <section key={grade} aria-label={`Grade ${grade}`}>
                <h2 className="mb-2 text-lg font-bold text-ep-charcoal">
                  Grade {grade}
                  <span className="ml-2 text-sm font-normal text-ep-muted">
                    Class of {profile.graduationYear - (12 - grade)}
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {TERMS.map((term) => {
                    const termEntries = gradeEntries.filter((e) => {
                      const end = e.startTerm + e.termSpan - 1;
                      return term >= e.startTerm && term <= Math.min(4, end);
                    });
                    return (
                      <div
                        key={term}
                        className="min-h-[90px] rounded-xl border border-ep-border-soft bg-ep-bg/60 p-2"
                      >
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ep-faint">
                          Term {term}
                        </p>
                        <div className="space-y-2">
                          {termEntries.map((e) =>
                            e.startTerm === term ? (
                              <EntryCard
                                key={e.id}
                                entry={e}
                                meta={catalogMeta.get(e.courseId)}
                                warnings={warningsByEntry.get(e.id) ?? []}
                                onUpdate={(patch) => updateEntry(e.id, patch)}
                                onRemove={() => removeEntry(e.id)}
                              />
                            ) : (
                              <div
                                key={e.id}
                                aria-hidden
                                className="rounded-lg border border-dashed border-ep-border bg-white/60 p-2 text-xs text-ep-faint"
                              >
                                {catalogMeta.get(e.courseId)?.title ?? e.courseId}{" "}
                                (continues)
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section aria-label="Plan validation" className="space-y-3">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Validation results
        </h2>
        {warnings.length === 0 ? (
          <WarningBanner severity="info" title="No issues detected">
            The deterministic checks found no problems with your current plan.
            Final scheduling always requires counselor confirmation.
          </WarningBanner>
        ) : (
          <ul className="space-y-2">
            {[...warnings]
              .sort((a, b) => {
                const rank = { error: 0, warning: 1, info: 2 } as const;
                return rank[a.severity] - rank[b.severity];
              })
              .map((w) => (
                <li key={w.id}>
                  <WarningBanner severity={w.severity} title={w.title}>
                    {w.detail}
                  </WarningBanner>
                </li>
              ))}
          </ul>
        )}
        <CounselorVerificationNotice />
      </section>
    </div>
  );
}
