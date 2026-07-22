"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Lock,
  LockOpen,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  GRADE_YEARS,
  TERMS,
  MAX_COURSES_PER_TERM,
  OPEN_PERIOD_LABEL,
  type CourseMeta,
  type PlanEntry,
} from "@/lib/domain/plan-types";
import {
  validatePlan,
  canPlaceCourse,
  countTermBlocks,
  openPeriodCount,
  termsWithRoom,
  type PlanWarning,
} from "@/lib/domain/plan-validation";
import { WarningBanner, CounselorVerificationNotice } from "@/components/ui";
import type { FuturePlanEntry, AddPlanEntryInput } from "@/lib/data/plan";
import {
  addPlanEntryAction,
  movePlanEntryAction,
  removePlanEntryAction,
  setPlanEntryLockAction,
} from "./actions";

export interface PlannerProfile {
  graduationYear: number;
  currentGrade: number;
  completedCourseIds: string[];
}

export interface Recommendation {
  courseId: string;
  title: string;
  reasons: string[];
}

/**
 * How the planner persists edits. The authenticated planner uses the default
 * server-action adapter (Postgres via RLS); the no-login preview swaps in a
 * localStorage-backed adapter so the same UI works without a session.
 */
export interface PlannerPersistence {
  add(input: AddPlanEntryInput): Promise<{ ok: boolean; id?: string; error?: string }>;
  move(entryId: string, gradeYear: number, startTerm: number): Promise<{ ok: boolean; error?: string }>;
  remove(entryId: string): Promise<{ ok: boolean }>;
  setLock(entryId: string, locked: boolean): Promise<{ ok: boolean }>;
}

const serverPersistence: PlannerPersistence = {
  add: (input) => addPlanEntryAction(input),
  move: (entryId, gradeYear, startTerm) => movePlanEntryAction(entryId, gradeYear, startTerm),
  remove: (entryId) => removePlanEntryAction(entryId),
  setLock: (entryId, locked) => setPlanEntryLockAction(entryId, locked),
};

const SOURCE_LABEL: Record<string, string> = {
  transcript: "From transcript",
  recommended: "Recommended",
  student: "Your choice",
};

export function PlannerClient({
  profile,
  initialFuture,
  history,
  recommendations,
  imported,
  persistence = serverPersistence,
}: {
  profile: PlannerProfile;
  initialFuture: FuturePlanEntry[];
  history: PlanEntry[];
  recommendations: Recommendation[];
  imported: boolean;
  persistence?: PlannerPersistence;
}) {
  const [future, setFuture] = useState<FuturePlanEntry[]>(initialFuture);
  const [catalog, setCatalog] = useState<Map<string, CourseMeta>>(new Map());
  const [metaReady, setMetaReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/planner-meta")
      .then((r) => r.json())
      .then((data: { courses: CourseMeta[] }) => {
        if (!cancelled) {
          setCatalog(new Map(data.courses.map((c) => [c.id, c])));
          setMetaReady(true);
        }
      })
      .catch(() => !cancelled && setMetaReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  // Domain entries = confirmed history (completed) + future plan.
  const domainEntries: PlanEntry[] = useMemo(
    () => [
      ...history,
      ...future.map((f) => ({
        id: f.id,
        courseId: f.courseId,
        gradeYear: f.gradeYear as PlanEntry["gradeYear"],
        startTerm: f.startTerm as PlanEntry["startTerm"],
        termSpan: f.termSpan,
        status: (f.status === "considering" ? "considering" : "planned") as PlanEntry["status"],
      })),
    ],
    [history, future],
  );

  const warnings = useMemo(() => {
    if (!metaReady) return [] as PlanWarning[];
    return validatePlan({
      entries: domainEntries,
      profile: {
        graduationYear: profile.graduationYear,
        currentGrade: profile.currentGrade as PlanEntry["gradeYear"],
        completedCourseIds: profile.completedCourseIds,
      },
      catalog,
    });
  }, [domainEntries, catalog, metaReady, profile]);

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

  /** Validate a proposed move before committing it (academic validity gate). */
  function moveWouldBeValid(entryId: string, gradeYear: number, startTerm: number): PlanWarning | null {
    const candidate = domainEntries.map((e) =>
      e.id === entryId
        ? { ...e, gradeYear: gradeYear as PlanEntry["gradeYear"], startTerm: startTerm as PlanEntry["startTerm"] }
        : e,
    );
    const result = validatePlan({
      entries: candidate,
      profile: {
        graduationYear: profile.graduationYear,
        currentGrade: profile.currentGrade as PlanEntry["gradeYear"],
        completedCourseIds: profile.completedCourseIds,
      },
      catalog,
    });
    return (
      result.find((w) => w.entryId === entryId && w.severity === "error") ?? null
    );
  }

  async function move(entryId: string, gradeYear: number, startTerm: number) {
    const entry = future.find((f) => f.id === entryId);
    if (!entry || entry.locked) return;
    // Four-block rule: never drop a course into a term that is already full
    // (unless it is already in that same slot).
    if (
      !(entry.gradeYear === gradeYear && entry.startTerm === startTerm) &&
      !canPlaceCourse(domainEntries, gradeYear, startTerm, entry.termSpan, entryId)
    ) {
      const room = termsWithRoom(domainEntries, gradeYear)
        .map((t) => `Term ${t}`)
        .join(", ");
      flash(
        `Grade ${gradeYear}, Term ${startTerm} already has ${MAX_COURSES_PER_TERM} courses.` +
          (room ? ` Terms with room: ${room}.` : " Remove a course first."),
      );
      return;
    }
    const blocker = moveWouldBeValid(entryId, gradeYear, startTerm);
    if (blocker) {
      flash(`Can't move there: ${blocker.title}`);
      return;
    }
    setFuture((prev) =>
      prev.map((f) => (f.id === entryId ? { ...f, gradeYear, startTerm } : f)),
    );
    await persistence.move(entryId, gradeYear, startTerm);
  }

  async function toggleLock(entryId: string) {
    const entry = future.find((f) => f.id === entryId);
    if (!entry) return;
    const locked = !entry.locked;
    setFuture((prev) => prev.map((f) => (f.id === entryId ? { ...f, locked } : f)));
    await persistence.setLock(entryId, locked);
  }

  async function remove(entryId: string) {
    setFuture((prev) => prev.filter((f) => f.id !== entryId));
    await persistence.remove(entryId);
  }

  async function add(courseId: string, gradeYear: number, startTerm: number, source: FuturePlanEntry["source"], reason?: string) {
    const meta = catalog.get(courseId);
    const termSpan = meta?.termSpan ?? 1;
    // Four-block rule: block adds that would push a term past four courses and
    // point the student at a term that still has room.
    if (!canPlaceCourse(domainEntries, gradeYear, startTerm, termSpan)) {
      const room = termsWithRoom(domainEntries, gradeYear)
        .map((t) => `Term ${t}`)
        .join(", ");
      flash(
        `Grade ${gradeYear}, Term ${startTerm} already has ${MAX_COURSES_PER_TERM} courses.` +
          (room ? ` Try ${room}, or replace an Open Period.` : " Choose another grade or remove a course."),
      );
      return;
    }
    const res = await persistence.add({
      courseId,
      gradeYear,
      startTerm,
      termSpan,
      source,
      recommendationReason: reason ?? null,
    });
    if (!res.ok) {
      flash(res.error === "duplicate" ? "That course is already in your plan." : "Couldn't add that course.");
      return;
    }
    if (res.id) {
      setFuture((prev) => [
        ...prev,
        {
          id: res.id!,
          courseId,
          gradeYear,
          startTerm,
          termSpan,
          status: "planned",
          locked: false,
          source,
          recommendationReason: reason ?? null,
        },
      ]);
    }
  }

  const plannedIds = new Set(future.map((f) => f.courseId));
  const historyIds = new Set(history.map((h) => h.courseId));

  return (
    <div className="space-y-6">
      {imported ? (
        <WarningBanner severity="info" title="Transcript imported">
          Your confirmed courses are placed below as completed history and your
          graduation progress is updated. Completed courses can&apos;t be dragged;
          plan your future courses around them.
        </WarningBanner>
      ) : null}

      {toast ? (
        <div role="status" className="rounded-r-lg border-l-4 border-ep-warn bg-ep-warn-soft p-3 text-sm text-ep-warn">
          {toast}
        </div>
      ) : null}

      <CoursePicker
        catalog={catalog}
        metaReady={metaReady}
        excluded={new Set([...plannedIds, ...historyIds])}
        currentGrade={profile.currentGrade}
        onAdd={(id, g, t) => add(id, g, t, "student")}
      />

      {recommendations.length > 0 ? (
        <section aria-label="Recommendations" className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ep-charcoal">
            <Sparkles className="h-5 w-5 text-ep-red" aria-hidden /> Suggested next courses
          </h2>
          <p className="mt-0.5 text-sm text-ep-muted">
            Based on your confirmed history, prerequisites, and goals.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommendations
              .filter((r) => !plannedIds.has(r.courseId) && !historyIds.has(r.courseId))
              .map((r) => (
                <div key={r.courseId} className="rounded-lg border border-ep-border-soft bg-ep-bg/40 p-3">
                  <p className="text-sm font-semibold text-ep-charcoal">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ep-muted">{r.reasons[0]}</p>
                  <button
                    type="button"
                    onClick={() => add(r.courseId, Math.min(12, profile.currentGrade + 1), 1, "recommended", r.reasons[0])}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-ep-red px-2.5 py-1 text-xs font-semibold text-white hover:bg-ep-red-dark"
                  >
                    <Plus className="h-3 w-3" /> Add to plan
                  </button>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {/* Four-year grid */}
      <div className="space-y-6">
        {GRADE_YEARS.map((grade) => (
          <section key={grade} aria-label={`Grade ${grade}`}>
            <h2 className="mb-2 text-lg font-bold text-ep-charcoal">
              Grade {grade}
              <span className="ml-2 text-sm font-normal text-ep-muted">
                Class of {profile.graduationYear - (12 - grade)}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TERMS.map((term) => {
                const cellHistory = history.filter(
                  (h) => h.gradeYear === grade && h.startTerm === term,
                );
                const cellFuture = future.filter(
                  (f) => f.gradeYear === grade && f.startTerm === term,
                );
                // Real blocks occupying this term (includes multi-term courses
                // that started earlier); fill the rest with Open Periods so the
                // term always shows four blocks.
                const realBlocks = countTermBlocks(domainEntries, grade, term);
                const openPeriods = openPeriodCount(realBlocks);
                const full = realBlocks >= MAX_COURSES_PER_TERM;
                return (
                  <div
                    key={term}
                    onDragOver={(e) => {
                      if (dragId) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (dragId) {
                        move(dragId, grade, term);
                        setDragId(null);
                      }
                    }}
                    className={`min-h-[96px] rounded-xl border p-2 transition-colors ${
                      dragId ? "border-dashed border-ep-red/50 bg-ep-red-soft/30" : "border-ep-border-soft bg-ep-bg/60"
                    }`}
                  >
                    <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ep-faint">
                      <span>Term {term}</span>
                      <span
                        className={full ? "text-ep-red" : "text-ep-faint"}
                        title={`${realBlocks} of ${MAX_COURSES_PER_TERM} blocks used`}
                      >
                        {realBlocks}/{MAX_COURSES_PER_TERM}
                      </span>
                    </p>
                    {cellHistory.map((h) => (
                      <HistoryChip key={h.id} entry={h} catalog={catalog} />
                    ))}
                    {cellFuture.map((f) => (
                      <FutureCard
                        key={f.id}
                        entry={f}
                        catalog={catalog}
                        warnings={warningsByEntry.get(f.id) ?? []}
                        onDragStart={() => setDragId(f.id)}
                        onDragEnd={() => setDragId(null)}
                        onMove={(g, t) => move(f.id, g, t)}
                        onToggleLock={() => toggleLock(f.id)}
                        onRemove={() => remove(f.id)}
                      />
                    ))}
                    {Array.from({ length: openPeriods }, (_, i) => (
                      <OpenPeriodBlock key={`open-${i}`} />
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-ep-card px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg-sunken"
        >
          <Printer className="h-4 w-4" /> Print / export summary
        </button>
      </div>

      {warnings.length > 0 ? (
        <section aria-label="Validation results" className="space-y-2">
          <h2 className="text-lg font-bold text-ep-charcoal">Validation results</h2>
          {[...warnings]
            .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
            .map((w) => (
              <WarningBanner key={w.id} severity={w.severity} title={w.title}>
                {w.detail}
              </WarningBanner>
            ))}
        </section>
      ) : null}

      <CounselorVerificationNotice />
    </div>
  );
}

function severityRank(s: PlanWarning["severity"]): number {
  return s === "error" ? 0 : s === "warning" ? 1 : 2;
}

/**
 * An Open Period is a schedule placeholder, not a course: it earns no credit
 * and satisfies no requirement. It fills a term's remaining blocks so students
 * see exactly how much room is left, and reads as intentional (not missing data).
 */
function OpenPeriodBlock() {
  return (
    <div
      className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-dashed border-ep-border bg-ep-card/40 px-2 py-1.5 text-ep-faint"
      aria-label={`${OPEN_PERIOD_LABEL} — available block`}
    >
      <LockOpen className="h-3.5 w-3.5" aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {OPEN_PERIOD_LABEL}
      </span>
    </div>
  );
}

function HistoryChip({ entry, catalog }: { entry: PlanEntry; catalog: Map<string, CourseMeta> }) {
  const meta = catalog.get(entry.courseId);
  return (
    <div className="mb-1.5 rounded-lg border border-ep-success/20 bg-ep-success-soft px-2 py-1.5">
      <p className="text-xs font-semibold leading-snug text-ep-success">
        {meta?.title ?? entry.courseId}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ep-success">
        Completed
      </p>
    </div>
  );
}

function FutureCard({
  entry,
  catalog,
  warnings,
  onDragStart,
  onDragEnd,
  onMove,
  onToggleLock,
  onRemove,
}: {
  entry: FuturePlanEntry;
  catalog: Map<string, CourseMeta>;
  warnings: PlanWarning[];
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (grade: number, term: number) => void;
  onToggleLock: () => void;
  onRemove: () => void;
}) {
  const meta = catalog.get(entry.courseId);
  const hasError = warnings.some((w) => w.severity === "error");
  const hasWarning = warnings.some((w) => w.severity === "warning");
  return (
    <div
      draggable={!entry.locked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`mb-1.5 rounded-lg border bg-ep-card px-2 py-1.5 shadow-card ${
        hasError ? "ring-1 ring-ep-red" : hasWarning ? "ring-1 ring-ep-warn" : "border-ep-border-soft"
      } ${entry.locked ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-snug text-ep-charcoal">
          {meta?.title ?? entry.courseId}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleLock}
            className={`rounded p-0.5 ${entry.locked ? "text-ep-red" : "text-ep-faint hover:text-ep-charcoal"}`}
            aria-label={entry.locked ? "Unlock course" : "Lock course"}
            title={entry.locked ? "Locked — won't be auto-changed" : "Lock this course"}
          >
            {entry.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-ep-faint hover:text-ep-red-dark no-print"
            aria-label="Remove course"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ep-faint">
          {SOURCE_LABEL[entry.source]}
        </span>
        <select
          value={`${entry.gradeYear}-${entry.startTerm}`}
          onChange={(e) => {
            const [g, t] = e.target.value.split("-").map(Number);
            onMove(g!, t!);
          }}
          disabled={entry.locked}
          className="no-print rounded border border-ep-border bg-ep-card px-1 py-0.5 text-[10px] disabled:opacity-50"
          aria-label="Move course"
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
      {entry.recommendationReason ? (
        <p className="mt-1 text-[10px] italic text-ep-muted">{entry.recommendationReason}</p>
      ) : null}
    </div>
  );
}

function CoursePicker({
  catalog,
  metaReady,
  excluded,
  currentGrade,
  onAdd,
}: {
  catalog: Map<string, CourseMeta>;
  metaReady: boolean;
  excluded: Set<string>;
  currentGrade: number;
  onAdd: (courseId: string, gradeYear: number, startTerm: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState(Math.min(12, Math.max(9, currentGrade)));
  const [term, setTerm] = useState(1);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return [...catalog.values()]
      .filter((c) => !excluded.has(c.id) && c.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, catalog, excluded]);

  return (
    <section className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
      <h2 className="text-lg font-bold text-ep-charcoal">Add a course</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ep-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={metaReady ? "Search courses…" : "Loading catalog…"}
            disabled={!metaReady}
            className="w-full rounded-lg border border-ep-border bg-ep-card py-2 pl-8 pr-3 text-sm outline-none focus:border-ep-red"
          />
        </div>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="rounded-lg border border-ep-border bg-ep-card px-2 py-2 text-sm">
          {GRADE_YEARS.map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
        <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className="rounded-lg border border-ep-border bg-ep-card px-2 py-2 text-sm">
          {TERMS.map((t) => (
            <option key={t} value={t}>Term {t}</option>
          ))}
        </select>
      </div>
      {results.length > 0 ? (
        <ul className="mt-2 divide-y divide-ep-border-soft rounded-lg border border-ep-border-soft overflow-hidden">
          {results.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-ep-charcoal">{c.title}</p>
                <p className="text-xs text-ep-muted">{c.department}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAdd(c.id, grade, term);
                  setQuery("");
                }}
                className="inline-flex items-center gap-1 rounded-md bg-ep-red px-2.5 py-1 text-xs font-semibold text-white hover:bg-ep-red-dark"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
