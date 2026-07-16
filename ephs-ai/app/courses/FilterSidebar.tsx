import Link from "next/link";

/**
 * Catalog filter sidebar. A plain GET form keeps filtering fully functional
 * without JavaScript, shareable via URL, and server-paginated.
 */
export function FilterSidebar({
  departments,
  pathways,
  current,
}: {
  departments: string[];
  pathways: string[];
  current: Record<string, string | undefined>;
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

  return (
    <form
      method="get"
      action="/courses"
      aria-label="Course filters"
      className="h-fit rounded-xl border border-ep-border-soft bg-white p-4 shadow-card"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="filter-q" className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            Search
          </label>
          <input
            id="filter-q"
            type="search"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Title, topic, prerequisite…"
            className="mt-1 w-full rounded-md border border-ep-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-department" className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            Department
          </label>
          <select
            id="filter-department"
            name="department"
            defaultValue={current.department ?? ""}
            className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
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
          <label htmlFor="filter-grade" className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            Grade
          </label>
          <select
            id="filter-grade"
            name="grade"
            defaultValue={current.grade ?? ""}
            className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
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
          <label htmlFor="filter-pathway" className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            Pathway
          </label>
          <select
            id="filter-pathway"
            name="pathway"
            defaultValue={current.pathway ?? ""}
            className="mt-1 w-full rounded-md border border-ep-border bg-white px-3 py-2 text-sm"
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
          <legend className="text-xs font-semibold uppercase tracking-wide text-ep-faint">
            Course type
          </legend>
          <div className="mt-1 space-y-1.5">
            {flagFilters.map((f) => (
              <label key={f.name} className="flex items-center gap-2 text-sm text-ep-ink">
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
            className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
          >
            Apply filters
          </button>
          <Link href="/courses" className="text-sm font-medium text-ep-muted hover:text-ep-charcoal">
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}
