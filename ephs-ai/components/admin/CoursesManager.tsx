"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import clsx from "clsx";
import { setCourseActiveAction, setCourseDurationAction } from "@/app/admin/actions";

export interface CourseSummary {
  id: string;
  title: string;
  department: string;
  termLength: string | null;
}

export interface CourseOverrideMap {
  [courseId: string]: { active: boolean; termCount: number | null; note: string | null };
}

const PAGE_SIZE = 50;

const inputCls =
  "rounded-md border border-ep-border bg-white px-2 py-1.5 text-sm outline-none focus:border-ep-red";

export function CoursesManager({
  courses,
  initialOverrides,
  persistence,
}: {
  courses: CourseSummary[];
  initialOverrides: CourseOverrideMap;
  persistence: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Local draft of the term-count input per course id (string for the field).
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) || c.department.toLowerCase().includes(q),
    );
  }, [courses, search]);

  const shown = filtered.slice(0, PAGE_SIZE);

  function overrideFor(id: string) {
    return initialOverrides[id];
  }

  function isActive(id: string): boolean {
    const o = overrideFor(id);
    return o ? o.active : true;
  }

  function draftFor(id: string): string {
    if (id in drafts) return drafts[id] ?? "";
    const o = overrideFor(id);
    return o && o.termCount !== null ? String(o.termCount) : "";
  }

  async function toggleActive(c: CourseSummary) {
    setBusyId(c.id);
    setError(null);
    setSuccess(null);
    const res = await setCourseActiveAction(c.id, !isActive(c.id));
    setBusyId(null);
    if (!res.ok) {
      setError(res.error === "unconfigured" ? "Supabase is not configured." : "Couldn't update that course.");
      return;
    }
    router.refresh();
  }

  async function saveDuration(c: CourseSummary) {
    const raw = draftFor(c.id).trim();
    let termCount: number | null = null;
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 12) {
        setError("Duration must be a whole number of terms between 1 and 12 (or blank to reset).");
        return;
      }
      termCount = n;
    }
    setBusyId(c.id);
    setError(null);
    setSuccess(null);
    const res = await setCourseDurationAction(c.id, termCount);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error === "unconfigured" ? "Supabase is not configured." : "Couldn't save the duration.");
      return;
    }
    setSuccess(`Saved duration for “${c.title}”.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by title or department…"
          className={clsx(inputCls, "w-full max-w-md")}
        />
        <span className="text-xs text-ep-faint">
          {filtered.length} match{filtered.length === 1 ? "" : "es"}
          {filtered.length > PAGE_SIZE ? ` · showing first ${PAGE_SIZE}` : ""}
        </span>
      </div>

      {success ? <p className="text-sm font-semibold text-emerald-700">{success}</p> : null}
      {error ? <p className="text-sm text-ep-red-dark">{error}</p> : null}

      {shown.length === 0 ? (
        <p className="text-sm text-ep-muted">No courses match that search.</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((c) => {
            const active = isActive(c.id);
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ep-border-soft bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ep-ink">
                    {c.title}
                    {!active ? (
                      <span className="ml-2 rounded-[3px] bg-ep-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ep-faint">
                        Inactive
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-ep-muted">
                    {c.department}
                    {c.termLength ? ` · ${c.termLength}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="flex items-center gap-1 text-xs text-ep-muted">
                    Terms
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={draftFor(c.id)}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                      }
                      placeholder="—"
                      className={clsx(inputCls, "w-16")}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => saveDuration(c)}
                    disabled={!persistence || busyId === c.id}
                    className="inline-flex items-center gap-1 rounded-md border border-ep-border px-2 py-1 text-xs font-semibold text-ep-muted hover:text-ep-charcoal disabled:opacity-40"
                  >
                    {busyId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    disabled={!persistence || busyId === c.id}
                    className={clsx(
                      "rounded-md border px-2 py-1 text-xs font-semibold disabled:opacity-40",
                      active
                        ? "border-ep-border text-ep-muted hover:text-ep-charcoal"
                        : "border-ep-red bg-ep-red-soft text-ep-red-dark",
                    )}
                  >
                    {active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
