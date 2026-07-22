"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import type { Club } from "@/lib/clubs/types";
import { searchClubs, type ClubFilters, type ClubSort } from "@/lib/clubs/search";
import { EmptyState } from "@/components/ui";
import { ClubCard } from "@/components/clubs/ClubCard";
import { ClubDetailModal } from "@/components/clubs/ClubDetailModal";

interface QuickFilter {
  label: string;
  patch: Partial<ClubFilters>;
}

const SORT_OPTIONS: Array<{ value: ClubSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "name", label: "Name (A–Z)" },
  { value: "category", label: "Category" },
];

const GRADES = ["9", "10", "11", "12"] as const;

const EMPTY: ClubFilters = { sort: "relevance" };

export function ClubsExplorer({
  clubs,
  categories,
  meetingDays,
}: {
  clubs: Club[];
  categories: string[];
  meetingDays: string[];
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [afterSchool, setAfterSchool] = useState(false);
  const [sort, setSort] = useState<ClubSort>("relevance");
  const [selected, setSelected] = useState<Club | null>(null);

  const filters: ClubFilters = useMemo(
    () => ({
      q: q.trim() || undefined,
      category: category || undefined,
      grade: grade || undefined,
      meetingDay: meetingDay || undefined,
      afterSchool: afterSchool || undefined,
      sort,
    }),
    [q, category, grade, meetingDay, afterSchool, sort],
  );

  const results = useMemo(() => searchClubs(clubs, filters), [clubs, filters]);

  const isFiltered =
    q.trim() !== "" ||
    category !== "" ||
    grade !== "" ||
    meetingDay !== "" ||
    afterSchool ||
    sort !== "relevance";

  function reset() {
    setQ("");
    setCategory("");
    setGrade("");
    setMeetingDay("");
    setAfterSchool(false);
    setSort("relevance");
  }

  // Quick chips only offered when the underlying value exists in the data.
  const quickFilters: QuickFilter[] = useMemo(() => {
    const chips: QuickFilter[] = [];
    for (const c of ["STEM", "Service", "Arts", "Leadership"]) {
      if (categories.includes(c)) chips.push({ label: c, patch: { category: c } });
    }
    if (meetingDays.includes("Tuesday")) {
      chips.push({ label: "Meets Tuesday", patch: { meetingDay: "Tuesday" } });
    }
    return chips;
  }, [categories, meetingDays]);

  function applyQuick(patch: Partial<ClubFilters>) {
    if (patch.category !== undefined) setCategory(patch.category ?? "");
    if (patch.grade !== undefined) setGrade(patch.grade ?? "");
    if (patch.meetingDay !== undefined) setMeetingDay(patch.meetingDay ?? "");
  }

  const selectClass =
    "mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm outline-none focus:border-ep-red";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-ep-faint";

  return (
    <div className="space-y-5">
      {/* Search + filters panel */}
      <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
        <div>
          <label htmlFor="club-search" className="sr-only">
            Search clubs
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ep-faint"
            />
            <input
              id="club-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, interest, or topic…"
              className="w-full rounded-md border border-ep-border py-2 pl-9 pr-9 text-sm outline-none focus:border-ep-red"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ep-faint hover:text-ep-charcoal"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="club-category" className={labelClass}>
              Category
            </label>
            <select
              id="club-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="club-grade" className={labelClass}>
              Grade
            </label>
            <select
              id="club-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={selectClass}
            >
              <option value="">Any grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="club-day" className={labelClass}>
              Meeting day
            </label>
            <select
              id="club-day"
              value={meetingDay}
              onChange={(e) => setMeetingDay(e.target.value)}
              className={selectClass}
            >
              <option value="">Any day</option>
              {meetingDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="club-sort" className={labelClass}>
              Sort
            </label>
            <select
              id="club-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as ClubSort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={afterSchool}
            onClick={() => setAfterSchool((v) => !v)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              afterSchool
                ? "border-ep-red bg-ep-red text-white"
                : "border-ep-border bg-white text-ep-charcoal hover:border-ep-red",
            )}
          >
            Has a scheduled meeting time
          </button>

          {isFiltered ? (
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-sm font-medium text-ep-muted hover:text-ep-charcoal"
            >
              Reset
            </button>
          ) : null}
        </div>

        {quickFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ep-border-soft pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ep-faint">
              Try
            </span>
            {quickFilters.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => applyQuick(chip.patch)}
                className="rounded-full border border-ep-border bg-ep-bg px-3 py-1 text-xs font-medium text-ep-ink transition-colors hover:border-ep-red hover:text-ep-red-dark"
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Result count */}
      <p role="status" aria-live="polite" className="text-sm text-ep-muted">
        {results.length} club{results.length === 1 ? "" : "s"}
        {isFiltered ? " match your filters" : " available"}
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="No clubs match"
          action={
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
            >
              Reset filters
            </button>
          }
        >
          Try removing a filter or searching with different words.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((club) => (
            <li key={club.id}>
              <ClubCard club={club} onView={() => setSelected(club)} />
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <ClubDetailModal club={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
