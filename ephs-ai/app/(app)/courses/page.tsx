import type { Metadata } from "next";
import Link from "next/link";
import { searchCatalog, type CatalogFilters } from "@/lib/catalog/search";
import { getDepartments, getPathways } from "@/lib/catalog/store";
import { getDeactivatedCourseIds } from "@/lib/catalog/overrides";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/ui";
import { FilterSidebar } from "./FilterSidebar";

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
  page?: string;
}

function toFilters(sp: SearchParams): CatalogFilters {
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
    page: sp.page ? Number(sp.page) : 1,
    pageSize: 24,
  };
}

function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "page") params.set(k, v);
  }
  params.set("page", String(page));
  return `/courses?${params.toString()}`;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">Course Catalog</h1>
        <p className="mt-1 text-sm text-ep-muted">
          Every course from the official EPHS Course Guide 2026-27, with exact
          descriptions, prerequisites, and page citations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          departments={departments}
          pathways={pathways}
          current={searchParams}
        />

        <div>
          <p className="mb-3 text-sm text-ep-muted" role="status">
            {result.total} course{result.total === 1 ? "" : "s"} found
            {filters.q ? (
              <>
                {" "}
                for <span className="font-semibold">“{filters.q}”</span>
              </>
            ) : null}
          </p>

          {result.items.length === 0 ? (
            <EmptyState
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
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          )}

          {result.totalPages > 1 ? (
            <nav
              aria-label="Catalog pages"
              className="mt-6 flex items-center justify-center gap-2 text-sm"
            >
              {result.page > 1 ? (
                <Link
                  href={pageHref(searchParams, result.page - 1)}
                  className="rounded-md border border-ep-border bg-white px-3 py-1.5 font-medium hover:bg-ep-bg"
                >
                  Previous
                </Link>
              ) : null}
              <span className="px-2 text-ep-muted">
                Page {result.page} of {result.totalPages}
              </span>
              {result.page < result.totalPages ? (
                <Link
                  href={pageHref(searchParams, result.page + 1)}
                  className="rounded-md border border-ep-border bg-white px-3 py-1.5 font-medium hover:bg-ep-bg"
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
