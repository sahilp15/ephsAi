import "server-only";
import fs from "node:fs";
import path from "node:path";
import type {
  Course,
  CourseGuideDataset,
  Pathway,
  SourcePage,
} from "./types";

/**
 * Server-side catalog store.
 *
 * The authoritative dataset (extracted from the official EPHS Course Guide
 * 2026-27 PDF) is loaded once per server process and indexed in memory.
 * 269 structured courses parse in a few milliseconds and occupy ~3 MB,
 * which comfortably serves thousands of students because the data is
 * read-only and shared across all requests.
 *
 * The production persistence path (Supabase Postgres, migrations, and the
 * idempotent `npm run data:import` command) mirrors this exact structure —
 * see supabase/migrations and docs/DATA_IMPORT_PLAN.md.
 */

let dataset: CourseGuideDataset | null = null;
let courseById: Map<string, Course> | null = null;
let pathwayById: Map<string, Pathway> | null = null;
let titleToId: Map<string, string> | null = null;
let pageByNumber: Map<number, SourcePage> | null = null;

export function getDataset(): CourseGuideDataset {
  if (!dataset) {
    const file = path.join(
      process.cwd(),
      "data",
      "ephs-course-guide-2026-27.json",
    );
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as CourseGuideDataset;
    dedupeCourseIds(parsed);
    dataset = parsed;
  }
  return dataset;
}

/**
 * The source guide contains a small number of distinct courses that normalize
 * to the same slug (e.g. the Multilingual Learner and Social Studies versions
 * of "Human Geography 9"). We never merge or drop them — that would fabricate
 * away a real distinction — but downstream code (id map, static params, React
 * keys) requires unique ids. So later collisions are given a stable
 * department-derived suffix. Nothing user-visible changes; only the internal
 * id is disambiguated.
 */
function dedupeCourseIds(ds: CourseGuideDataset): void {
  const seen = new Set<string>();
  for (const course of ds.courses) {
    if (!seen.has(course.id)) {
      seen.add(course.id);
      continue;
    }
    const suffix = course.primary_department
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let candidate = `${course.id}-${suffix}`;
    let n = 2;
    while (seen.has(candidate)) candidate = `${course.id}-${suffix}-${n++}`;
    course.id = candidate;
    seen.add(candidate);
  }
}

export function getCourses(): Course[] {
  return getDataset().courses;
}

export function getCourseById(id: string): Course | undefined {
  if (!courseById) {
    courseById = new Map(getCourses().map((c) => [c.id, c]));
  }
  return courseById.get(id);
}

export function getPathways(): Pathway[] {
  return getDataset().pathways;
}

export function getPathwayById(id: string): Pathway | undefined {
  if (!pathwayById) {
    pathwayById = new Map(getPathways().map((p) => [p.id, p]));
  }
  return pathwayById.get(id);
}

export function getSourcePage(page: number): SourcePage | undefined {
  if (!pageByNumber) {
    pageByNumber = new Map(getDataset().source_pages.map((p) => [p.page, p]));
  }
  return pageByNumber.get(page);
}

export function getDepartments(): string[] {
  const set = new Set<string>();
  for (const c of getCourses()) {
    for (const d of c.departments) set.add(d);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Normalize a course name for conservative matching. */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\bnew!\s*/g, "")
    .replace(/\s+a\s*&\s*b\b/g, "") // "Chinese 1 A & B" → "chinese 1"
    .replace(/\s+a\/b\b/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Map of normalized known titles (canonical titles, raw titles seen, and
 * per-appearance titles) → course id. Used by the prerequisite parser and
 * pathway resolution. Only exact normalized matches are accepted; anything
 * fuzzier is intentionally left unresolved.
 */
export function getTitleIndex(): Map<string, string> {
  if (!titleToId) {
    titleToId = new Map();
    for (const c of getCourses()) {
      const names = new Set<string>([
        c.title,
        ...c.raw_titles_seen,
        ...c.source_appearances.map((a) => a.title),
      ]);
      for (const n of names) {
        const key = normalizeTitle(n);
        if (key && !titleToId.has(key)) titleToId.set(key, c.id);
      }
    }
  }
  return titleToId;
}

export function resolveCourseName(name: string): string | undefined {
  return getTitleIndex().get(normalizeTitle(name));
}
