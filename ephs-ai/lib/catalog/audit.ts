import "server-only";
import { getDataset, resolveCourseName } from "./store";

/**
 * Data-quality audit over the active course-guide dataset. Used by the
 * /admin page and mirrored by scripts/data-audit.mjs (which writes
 * docs/DATA_AUDIT.md).
 */

export interface DataAuditReport {
  datasetId: string;
  schemaVersion: string;
  sourceFilename: string;
  sourceSha256: string;
  pageCount: number;
  courseCount: number;
  appearanceCount: number;
  departmentCount: number;
  coursesMissingDescription: string[];
  coursesMissingGrades: string[];
  coursesMissingCredits: string[];
  coursesWithConflicts: string[];
  crossListedCourses: string[];
  invalidSourcePageRefs: string[];
  unresolvedPathwayNames: Array<{ pathway: string; names: string[] }>;
  flagCounts: Record<string, number>;
  knownLimitations: string[];
}

export function buildDataAudit(): DataAuditReport {
  const d = getDataset();
  const maxPage = d.generated_from.page_count;

  const flagCounts: Record<string, number> = {
    ap: 0,
    honors: 0,
    capstone: 0,
    skinny: 0,
    cis: 0,
    new_course: 0,
    college_credit: 0,
  };
  const departments = new Set<string>();
  const missingDescription: string[] = [];
  const missingGrades: string[] = [];
  const missingCredits: string[] = [];
  const withConflicts: string[] = [];
  const crossListed: string[] = [];
  const invalidPages: string[] = [];

  for (const c of d.courses) {
    for (const dep of c.departments) departments.add(dep);
    if (!c.description) missingDescription.push(c.id);
    if (c.grades_allowed.length === 0) missingGrades.push(c.id);
    if (!c.credits_raw) missingCredits.push(c.id);
    if (
      c.data_quality.requires_counselor_verification ||
      c.data_quality.conflicts_detected.length > 0
    ) {
      withConflicts.push(c.id);
    }
    if (c.source_appearances.length > 1) crossListed.push(c.id);
    for (const p of c.source_pages) {
      if (p < 1 || p > maxPage) invalidPages.push(`${c.id}: page ${p}`);
    }
    if (c.flags.ap) flagCounts.ap = (flagCounts.ap ?? 0) + 1;
    if (c.flags.honors) flagCounts.honors = (flagCounts.honors ?? 0) + 1;
    if (c.flags.capstone) flagCounts.capstone = (flagCounts.capstone ?? 0) + 1;
    if (c.flags.skinny) flagCounts.skinny = (flagCounts.skinny ?? 0) + 1;
    if (c.flags.cis) flagCounts.cis = (flagCounts.cis ?? 0) + 1;
    if (c.flags.new_course)
      flagCounts.new_course = (flagCounts.new_course ?? 0) + 1;
    if (c.college_credit_available)
      flagCounts.college_credit = (flagCounts.college_credit ?? 0) + 1;
  }

  const unresolvedPathwayNames = d.pathways.map((p) => ({
    pathway: p.name,
    names: p.unresolved_or_external_course_names.filter(
      (n) => !resolveCourseName(n),
    ),
  }));

  return {
    datasetId: d.dataset_id,
    schemaVersion: d.schema_version,
    sourceFilename: d.generated_from.filename,
    sourceSha256: d.generated_from.pdf_sha256,
    pageCount: maxPage,
    courseCount: d.courses.length,
    appearanceCount: d.course_appearances.length,
    departmentCount: departments.size,
    coursesMissingDescription: missingDescription,
    coursesMissingGrades: missingGrades,
    coursesMissingCredits: missingCredits,
    coursesWithConflicts: withConflicts,
    crossListedCourses: crossListed,
    invalidSourcePageRefs: invalidPages,
    unresolvedPathwayNames,
    flagCounts,
    knownLimitations: d.known_limitations,
  };
}
