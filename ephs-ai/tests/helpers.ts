import type { CourseMeta } from "@/lib/domain/plan-types";
import type { ParsedPrerequisite } from "@/lib/domain/prerequisites";

/** Minimal course-meta factory for domain tests. */
export function makeCourse(overrides: Partial<CourseMeta> & { id: string }): CourseMeta {
  return {
    title: overrides.id,
    department: "Test",
    grades: [9, 10, 11, 12],
    creditsRaw: "1",
    termSpan: 1,
    termLabel: "one term unless otherwise noted",
    spanRequiresVerification: false,
    repeatable: false,
    prereq: { kind: "none", raw: null } satisfies ParsedPrerequisite,
    flags: {
      ap: false,
      honors: false,
      capstone: false,
      skinny: false,
      cis: false,
      new_course: false,
    },
    gradStatements: [],
    pathways: [],
    sourcePages: [10],
    collegeCredit: false,
    ...overrides,
  };
}

/** Resolver over a fixed set of known titles. */
export function makeResolver(titles: Record<string, string>) {
  const normalized = new Map(
    Object.entries(titles).map(([name, id]) => [normalize(name), id]),
  );
  return (name: string) => normalized.get(normalize(name));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+a\s*&\s*b\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
