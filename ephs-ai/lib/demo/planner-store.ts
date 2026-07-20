"use client";

import type { AcademicRecordInput } from "@/lib/domain/academic-history";
import type { FuturePlanEntry, AddPlanEntryInput } from "@/lib/data/plan";
import type { ConfirmRow } from "@/components/transcript/TranscriptReview";
import type { PlannerPersistence } from "@/app/plan/PlannerClient";

/**
 * Browser-only persistence for the no-login preview.
 *
 * The authenticated app stores confirmed transcript history in `academic_records`
 * and future plan entries in `plan_entries` (Postgres, RLS-protected). The
 * preview has no session, so this module keeps the exact same data shapes in
 * `localStorage` instead. That lets the real `TranscriptReview` and
 * `PlannerClient` components drive a fully working transcript-to-plan flow
 * without a database, while the production data path stays untouched.
 */

const RECORDS_KEY = "ephs-ai:demo:records:v1";
const FUTURE_KEY = "ephs-ai:demo:future:v1";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) - preview simply won't persist */
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}

export function readDemoRecords(): AcademicRecordInput[] {
  return readJSON<AcademicRecordInput[]>(RECORDS_KEY, []);
}

export function readDemoFuture(): FuturePlanEntry[] {
  return readJSON<FuturePlanEntry[]>(FUTURE_KEY, []);
}

export function clearDemoPlanner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECORDS_KEY);
    window.localStorage.removeItem(FUTURE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Turn the reviewer's confirmed rows into academic records and store them.
 * Mirrors the authenticated confirm route: rows with no chosen catalog match
 * become transfer or unmatched records, and a fresh confirmation replaces any
 * previously imported preview history.
 */
export function saveConfirmedRecords(rows: ConfirmRow[]): number {
  const included = rows.filter((r) => r.include);
  const records: AcademicRecordInput[] = included.map((r) => {
    let recordType = r.recordType;
    if (!r.courseId && recordType !== "unmatched") {
      recordType = r.isTransfer ? "transfer" : "unmatched";
    }
    return {
      id: r.rowId ?? makeId(),
      courseId: r.courseId,
      originalCourseName: r.originalCourseName,
      recordType,
      gradeLevel: r.gradeLevel,
      term: r.term,
      creditsEarned: r.creditsEarned,
      isTransfer: r.isTransfer,
    };
  });
  writeJSON(RECORDS_KEY, records);
  return records.length;
}

/**
 * A `PlannerPersistence` backed by `localStorage`, so the preview's four-year
 * plan supports the same add / move / remove / lock interactions as the real
 * planner. `onChange` lets the page re-render from the freshly written state.
 */
export function createDemoPlannerPersistence(
  onChange: (future: FuturePlanEntry[]) => void,
): PlannerPersistence {
  function commit(next: FuturePlanEntry[]): FuturePlanEntry[] {
    writeJSON(FUTURE_KEY, next);
    onChange(next);
    return next;
  }

  return {
    async add(input: AddPlanEntryInput) {
      const future = readDemoFuture();
      if (future.some((f) => f.courseId === input.courseId)) {
        return { ok: false, error: "duplicate" };
      }
      const id = makeId();
      commit([
        ...future,
        {
          id,
          courseId: input.courseId,
          gradeYear: input.gradeYear,
          startTerm: input.startTerm,
          termSpan: input.termSpan,
          status: input.status ?? "planned",
          locked: input.locked ?? false,
          source: input.source ?? "student",
          recommendationReason: input.recommendationReason ?? null,
        },
      ]);
      return { ok: true, id };
    },
    async move(entryId: string, gradeYear: number, startTerm: number) {
      commit(
        readDemoFuture().map((f) =>
          f.id === entryId ? { ...f, gradeYear, startTerm } : f,
        ),
      );
      return { ok: true };
    },
    async remove(entryId: string) {
      commit(readDemoFuture().filter((f) => f.id !== entryId));
      return { ok: true };
    },
    async setLock(entryId: string, locked: boolean) {
      commit(
        readDemoFuture().map((f) => (f.id === entryId ? { ...f, locked } : f)),
      );
      return { ok: true };
    },
  };
}
