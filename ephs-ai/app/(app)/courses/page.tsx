import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, Search, X } from "lucide-react";
import { searchCatalog, type CatalogFilters } from "@/lib/catalog/search";
import { getDepartments, getPathways } from "@/lib/catalog/store";
import { getDeactivatedCourseIds } from "@/lib/catalog/overrides";
import { CourseCard } from "@/components/CourseCard";
import {
  CourseBadge,
  courseBadgeLabels,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import type { Course } from "@/lib/catalog/types";
import { FilterPanel } from "./FilterSidebar";
import { MobileFilterDrawer } from "./MobileFilterDrawer";

export const metadata: Metadata = { title: "Course Catalog" };

interface SearchParams {
  [key: string]: string | undefined;
  q?: string;
  department?: string;
  grade?: string;
  pathway?: string;
  ap?: string;
  honors?: string;
  collegeCredit?: string;
  capstone?: string;
  skinny?: string;
  newCourse?: string;
  gradRequirement?: string;
  sort?: string;
  view?: string;
  page?: string;
}

const FLAG_LABELS: Record<string, string> = {
  ap: "AP",
  honors: "Honors",
  collegeCredit: "College credit",
  capstone: "Capstone",
  skinny: "Skinny",
  newCourse: "New for 2026-27",
  gradRequirement: "Graduation statement",
};

function toFilters(sp: SearchParams): CatalogFilters {
  const sort = sp.sort;
  return {
    q: sp.q,
    department: sp.department || undefined,
    grade: sp.grade ? Number(sp.grade) : undefined,
    pathway: sp.pathway || undefined,
    ap: sp.ap === "1",
    honors: sp.honors === "1",
    collegeCredit: sp.collegeCredit === "1",
    capstone: sp.capstone === "1",
    skinny: sp.skinny === "1",
    newCourse: sp.newCourse === "1",
    gradRequirement: sp.gradRequirement === "1",
    sort: sort === "title" || sort === "department" ? sort : undefined,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: 24,
  };
}

/** Build a /courses href with param overrides (null clears; page resets to 1). */
function hrefWith(
  sp: SearchParams,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "page") params.set(k, v);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  return s ? `/courses?${s}` : "/courses";
}

function activeChips(sp: SearchParams): Array<{ key: string; label: string }> {
  const chips: Array<{ key: string; label: string }> = [];
  if (sp.q) chips.push({ key: "q", label: `“${sp.q}”` });
  if (sp.department) chips.push({ key: "department", label: sp.department });
  if (sp.grade) chips.push({ key: "grade", label: `Grade ${sp.grade}` });
  if (sp.pathway) chips.push({ key: "pathway", label: sp.pathway });
  for (const [flag, label] of Object.entries(FLAG_LABELS)) {
    if (sp[flag] === "1") chips.push({ key: flag, label });
  }
  return chips;
}

function CourseRow({ course }: { course: Course }) {
  const badges = courseBadgeLabels(course.flags, course.college_credit_available);
  return (
    <li>
      <Link
        href={`/courses/${course.id}`}
        className="flex items-center gap-4 rounded-xl border border-ep-border-soft bg-ep-card px-4 py-3 shadow-xs transition-colors hover:border-ep-border hover:bg-ep-bg-sunken/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-ep-charcoal">
              {course.title}
            </span>
            {badges.slice(0, 3).map((b) => (
              <CourseBadge key={b} label={b} />
            ))}
          </div>
          <p className="mt-0.5 truncate text-xs text-ep-muted">
            {course.departments.join(" · ")} · Grades{" "}
            {course.grades_raw ?? "see guide"}
          </p>
        </div>
        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ep-faint" />
      </Link>
    </li>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = toFilters(searchParams);
  filters.excludeIds = await getDeactivatedCourseIds();
  const result = searchCatalog(filters);
  const departments = getDepartments();
  const pathways = getPathways().map((p) => p.name);

  const chips = activeChips(searchParams);
  const view = searchParams.view === "list" ? "list" : "grid";
  const currentSort = filters.sort ?? (searchParams.q ? "relevance" : "title");

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "title", label: "Title A–Z" },
    { value: "department", label: "Department" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Catalog"
        title="Course catalog"
        lede="Every course from the official EPHS Course Guide 2026-27, with exact descriptions, prerequisites, and page citations."
      />

      <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
        {/* Desktop filter rail */}
        <aside className="hidden h-fit rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card lg:block">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ep-charcoal">
            <Search aria-hidden className="h-4 w-4 text-ep-red" />
            Refine
          </div>
          <FilterPanel
            departments={departments}
            pathways={pathways}
            current={searchParams}
          />
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileFilterDrawer activeCount={chips.length}>
                <FilterPanel
                  departments={departments}
                  pathways={pathways}
                  current={searchParams}
                  idPrefix="m-"
                />
              </MobileFilterDrawer>
              <p className="text-sm text-ep-muted" role="status" aria-live="polite">
                <span className="font-semibold text-ep-charcoal">
                  {result.total}
                </span>{" "}
                course{result.total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="hidden items-center gap-0.5 rounded-lg border border-ep-border bg-ep-card p-0.5 sm:flex">
                {sortOptions.map((o) => (
                  <Link
                    key={o.value}
                    href={hrefWith(searchParams, {
                      sort: o.value === "relevance" ? null : o.value,
                    })}
                    aria-current={currentSort === o.value ? "true" : undefined}
                    className={
                      currentSort === o.value
                        ? "rounded-md bg-ep-red-soft px-2.5 py-1 text-xs font-semibold text-ep-red-dark"
                        : "rounded-md px-2.5 py-1 text-xs font-medium text-ep-muted hover:text-ep-charcoal"
                    }
                  >
                    {o.label}
                  </Link>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 rounded-lg border border-ep-border bg-ep-card p-0.5">
                <Link
                  href={hrefWith(searchParams, { view: null })}
                  aria-label="Grid view"
                  aria-current={view === "grid" ? "true" : undefined}
                  className={
                    view === "grid"
                      ? "rounded-md bg-ep-red-soft p-1.5 text-ep-red-dark"
                      : "rounded-md p-1.5 text-ep-faint hover:text-ep-charcoal"
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                </Link>
                <Link
                  href={hrefWith(searchParams, { view: "list" })}
                  aria-label="List view"
                  aria-current={view === "list" ? "true" : undefined}
                  className={
                    view === "list"
                      ? "rounded-md bg-ep-red-soft p-1.5 text-ep-red-dark"
                      : "rounded-md p-1.5 text-ep-faint hover:text-ep-charcoal"
                  }
                >
                  <List className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Active-filter chips */}
          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={hrefWith(searchParams, { [c.key]: null })}
                  className="inline-flex items-center gap-1 rounded-full border border-ep-border bg-ep-card py-1 pl-3 pr-2 text-xs font-medium text-ep-ink transition-colors hover:border-ep-red/40 hover:text-ep-red-dark"
                >
                  {c.label}
                  <X aria-hidden className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Link>
              ))}
              <Link
                href="/courses"
                className="text-xs font-semibold text-ep-red-dark underline-offset-2 hover:underline"
              >
                Clear all
              </Link>
            </div>
          ) : null}

          {/* Results */}
          <div className="mt-5">
            {result.items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No courses match these filters"
                action={
                  <Link
                    href="/courses"
                    className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
                  >
                    Clear all filters
                  </Link>
                }
              >
                Try removing a filter or using different search words.
              </EmptyState>
            ) : view === "list" ? (
              <ul className="space-y-2">
                {result.items.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))}
              </ul>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((course) => (
                  <li key={course.id}>
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 ? (
            <nav
              aria-label="Catalog pages"
              className="mt-8 flex items-center justify-center gap-2 text-sm"
            >
              {result.page > 1 ? (
                <Link
                  href={hrefWith(searchParams, { page: String(result.page - 1) })}
                  className="rounded-lg border border-ep-border bg-ep-card px-3.5 py-2 font-medium hover:bg-ep-bg-sunken"
                >
                  Previous
                </Link>
              ) : null}
              <span className="px-2 text-ep-muted">
                Page {result.page} of {result.totalPages}
              </span>
              {result.page < result.totalPages ? (
                <Link
                  href={hrefWith(searchParams, { page: String(result.page + 1) })}
                  className="rounded-lg border border-ep-border bg-ep-card px-3.5 py-2 font-medium hover:bg-ep-bg-sunken"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
