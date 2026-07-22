import Link from "next/link";

/**
 * Catalog filter panel. A plain GET form keeps filtering fully functional
 * without JavaScript, shareable via URL, and server-paginated. Rendered both in
 * the desktop rail and inside the mobile filter drawer. `sort` and `view` are
 * carried through as hidden inputs so applying filters preserves them.
 */
export function FilterPanel({
  departments,
  pathways,
  current,
  idPrefix = "",
}: {
  departments: string[];
  pathways: string[];
  current: Record<string, string | undefined>;
  idPrefix?: string;
}) {
  const flagFilters = [
    { name: "ap", label: "AP" },
    { name: "honors", label: "Honors" },
    { name: "collegeCredit", label: "College credit available" },
    { name: "capstone", label: "Capstone" },
    { name: "skinny", label: "Skinny" },
    { name: "newCourse", label: "New for 2026-27" },
    { name: "gradRequirement", label: "Fulfills a graduation statement" },
  ] as const;

  const id = (s: string) => `${idPrefix}${s}`;
  const labelCls =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-ep-faint";
  const controlCls =
    "mt-1.5 w-full rounded-lg border border-ep-border bg-ep-card px-3 py-2 text-sm text-ep-charcoal outline-none focus:border-ep-red";

  return (
    <form method="get" action="/courses" aria-label="Course filters" className="space-y-4">
      {/* Preserve presentation params across filter submits. */}
      {current.sort ? <input type="hidden" name="sort" value={current.sort} /> : null}
      {current.view ? <input type="hidden" name="view" value={current.view} /> : null}

      <div>
        <label htmlFor={id("filter-q")} className={labelCls}>
          Search
        </label>
        <input
          id={id("filter-q")}
          type="search"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="Title, topic, prerequisite…"
          className={controlCls}
        />
      </div>

      <div>
        <label htmlFor={id("filter-department")} className={labelCls}>
          Department
        </label>
        <select
          id={id("filter-department")}
          name="department"
          defaultValue={current.department ?? ""}
          className={controlCls}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id("filter-grade")} className={labelCls}>
          Grade
        </label>
        <select
          id={id("filter-grade")}
          name="grade"
          defaultValue={current.grade ?? ""}
          className={controlCls}
        >
          <option value="">Any grade</option>
          {[9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id("filter-pathway")} className={labelCls}>
          Pathway
        </label>
        <select
          id={id("filter-pathway")}
          name="pathway"
          defaultValue={current.pathway ?? ""}
          className={controlCls}
        >
          <option value="">All pathways</option>
          {pathways.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={labelCls}>Course type</legend>
        <div className="mt-2 space-y-1">
          {flagFilters.map((f) => (
            <label
              key={f.name}
              className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-ep-ink"
            >
              <input
                type="checkbox"
                name={f.name}
                value="1"
                defaultChecked={current[f.name] === "1"}
                className="h-4 w-4 rounded border-ep-border accent-[#D8272E]"
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
        >
          Apply filters
        </button>
        <Link
          href="/courses"
          className="rounded-lg px-3 py-2 text-sm font-medium text-ep-muted hover:text-ep-charcoal"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
