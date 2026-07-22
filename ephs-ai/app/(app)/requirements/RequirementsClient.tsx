"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, HelpCircle } from "lucide-react";
import type { CourseMeta } from "@/lib/domain/plan-types";
import {
  buildGraduationReport,
  type RequirementState,
} from "@/lib/domain/graduation-rules";
import { CounselorVerificationNotice, WarningBanner } from "@/components/ui";
import clsx from "clsx";

const STATE_META: Record<
  RequirementState,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  satisfied: {
    label: "Verified requirement satisfied",
    icon: CheckCircle2,
    className: "text-ep-success",
  },
  open: {
    label: "Verified requirement still open",
    icon: CircleDashed,
    className: "text-ep-warn",
  },
  needs_confirmation: {
    label: "Needs counselor confirmation",
    icon: HelpCircle,
    className: "text-ep-info",
  },
};

export function RequirementsClient({
  qualifyingPersonalFinanceCourses,
  artsEligibleByDepartment,
  rulesSourcePage,
  sourceOfTruthNote,
  graduationYear,
  completedCourseIds,
  plannedCourseIds,
}: {
  qualifyingPersonalFinanceCourses: string[];
  artsEligibleByDepartment: Record<string, string[]>;
  rulesSourcePage: number;
  sourceOfTruthNote: string;
  graduationYear: number;
  completedCourseIds: string[];
  plannedCourseIds: string[];
}) {
  const [catalogList, setCatalogList] = useState<CourseMeta[]>([]);
  const [metaReady, setMetaReady] = useState(false);
  const [gradYear, setGradYear] = useState<number | null>(null);
  const [projection, setProjection] = useState<"current" | "projected">(
    "projected",
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/planner-meta")
      .then((r) => r.json())
      .then((data: { courses: CourseMeta[] }) => {
        if (!cancelled) {
          setCatalogList(data.courses);
          setMetaReady(true);
        }
      })
      .catch(() => !cancelled && setMetaReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogMeta = useMemo(
    () => new Map(catalogList.map((c) => [c.id, c])),
    [catalogList],
  );

  const effectiveGradYear = gradYear ?? graduationYear;

  const report = useMemo(() => {
    if (!metaReady) return null;
    const planIds = projection === "projected" ? plannedCourseIds : [];
    return buildGraduationReport({
      profile: {
        graduationYear: effectiveGradYear,
        completedCourseIds,
      },
      plannedOrCompletedIds: [...completedCourseIds, ...planIds],
      catalog: catalogList,
      qualifyingPersonalFinanceCourses,
      artsEligibleByDepartment,
      rulesSourcePage,
    });
  }, [
    metaReady,
    projection,
    plannedCourseIds,
    effectiveGradYear,
    completedCourseIds,
    catalogList,
    qualifyingPersonalFinanceCourses,
    artsEligibleByDepartment,
    rulesSourcePage,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker">Requirements</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ep-charcoal sm:text-4xl">
          Graduation requirements
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ep-muted">{sourceOfTruthNote}</p>
      </div>

      <div className="no-print flex flex-wrap items-end gap-4 rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
        <div>
          <label htmlFor="grad-year" className="block text-xs font-semibold text-ep-faint">
            Graduation year
          </label>
          <select
            id="grad-year"
            value={effectiveGradYear}
            onChange={(e) => setGradYear(Number(e.target.value))}
            className="mt-1 rounded-lg border border-ep-border bg-ep-card px-3 py-2 text-sm"
          >
            {[2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                Class of {y}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="text-xs font-semibold text-ep-faint">View</legend>
          <div className="mt-1 flex rounded-lg border border-ep-border overflow-hidden">
            {(["current", "projected"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setProjection(mode)}
                aria-pressed={projection === mode}
                className={clsx(
                  "px-3 py-1.5 text-sm font-medium first:rounded-l-md last:rounded-r-md",
                  projection === mode
                    ? "bg-ep-red text-white"
                    : "bg-ep-card text-ep-muted hover:text-ep-charcoal",
                )}
              >
                {mode === "current" ? "Completed only" : "Including planned"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {effectiveGradYear <= 2027 ? (
        <WarningBanner severity="info" title="Class of 2027 rule">
          The guide states the Class of 2027 must earn a technology credit
          (personal finance is not required for this class year). Source: EPHS
          Course Guide 2026-27, page {rulesSourcePage}.
        </WarningBanner>
      ) : (
        <WarningBanner severity="info" title="Class of 2028 and beyond rule">
          The guide states the Class of 2028 and beyond must earn a personal
          finance credit (qualifying courses:{" "}
          {qualifyingPersonalFinanceCourses.join(", ")}). Source: EPHS Course
          Guide 2026-27, page {rulesSourcePage}.
        </WarningBanner>
      )}

      {!report ? (
        <p role="status" className="text-sm text-ep-muted">
          Loading requirement checks…
        </p>
      ) : (
        <ul className="space-y-3">
          {report.items.map((item) => {
            const meta = STATE_META[item.state];
            const StateIcon = meta.icon;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <StateIcon aria-hidden className={clsx("mt-0.5 h-5 w-5 shrink-0", meta.className)} />
                  <div>
                    <p className="font-semibold text-ep-charcoal">{item.title}</p>
                    <p className={clsx("text-xs font-semibold uppercase tracking-wide", meta.className)}>
                      {meta.label}
                    </p>
                    <p className="mt-1 text-sm text-ep-muted">{item.detail}</p>
                    {item.matchedCourseIds.length > 0 ? (
                      <p className="mt-1 text-sm text-ep-ink">
                        Counting:{" "}
                        {item.matchedCourseIds.map((id, i) => (
                          <span key={id}>
                            {i > 0 ? ", " : ""}
                            <Link href={`/courses/${id}`} className="font-medium text-ep-red-dark hover:underline">
                              {catalogMeta.get(id)?.title ?? id}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : null}
                    {item.sourcePages.length > 0 ? (
                      <p className="mt-1 text-xs text-ep-faint">
                        Source: EPHS Course Guide 2026-27, page{" "}
                        {item.sourcePages.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {report && report.statementMatches.length > 0 ? (
        <section aria-label="Statement matches">
          <h2 className="text-lg font-bold text-ep-charcoal">
            Guide statements matched by your courses
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ep-ink">
            {report.statementMatches.map((m) => (
              <li key={m.statement} className="rounded-lg border border-ep-border-soft bg-ep-card p-3">
                <span className="font-medium">Fulfills {m.statement}</span>
                <span className="text-ep-muted">
                  {" "}
                  - {m.courseIds.map((id) => catalogMeta.get(id)?.title ?? id).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Arts requirement eligible courses">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Arts-requirement eligible courses (from the guide)
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(artsEligibleByDepartment).map(([dept, names]) => (
            <div key={dept} className="rounded-xl border border-ep-border-soft bg-ep-card p-3 shadow-card">
              <p className="text-sm font-bold text-ep-charcoal">{dept}</p>
              <ul className="mt-1 list-inside list-disc text-xs text-ep-muted">
                {names.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
