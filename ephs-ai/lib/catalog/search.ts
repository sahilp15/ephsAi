import "server-only";
import { getCourses } from "./store";
import type { Course } from "./types";

/**
 * Server-side catalog search and filtering.
 *
 * The in-memory index covers title, description, departments, prerequisites,
 * notes, pathway names, and graduation statements - the same fields the
 * production Postgres migration indexes with tsvector/trigram (see
 * supabase/migrations). Results are paginated server-side; the client never
 * receives the whole catalog.
 */

export interface CatalogFilters {
  q?: string;
  department?: string;
  grade?: number;
  ap?: boolean;
  honors?: boolean;
  collegeCredit?: boolean;
  capstone?: boolean;
  skinny?: boolean;
  newCourse?: boolean;
  pathway?: string;
  gradRequirement?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CatalogPage {
  items: Course[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SearchDoc {
  course: Course;
  haystack: string;
  titleLower: string;
}

let docs: SearchDoc[] | null = null;

function getDocs(): SearchDoc[] {
  if (!docs) {
    docs = getCourses().map((course) => ({
      course,
      titleLower: course.title.toLowerCase(),
      haystack: [
        course.title,
        course.description,
        course.departments.join(" "),
        course.prerequisite_raw ?? "",
        course.notes.join(" "),
        course.pathways.join(" "),
        course.graduation_requirements_fulfilled_raw.join(" "),
        course.college_credit_raw.join(" "),
      ]
        .join(" \n ")
        .toLowerCase(),
    }));
  }
  return docs;
}

function relevance(doc: SearchDoc, terms: string[]): number {
  let score = 0;
  for (const t of terms) {
    if (doc.titleLower.includes(t)) score += 5;
    else if (doc.haystack.includes(t)) score += 1;
    else return 0; // all terms must match somewhere
  }
  return score;
}

export function searchCatalog(filters: CatalogFilters): CatalogPage {
  const {
    q,
    department,
    grade,
    ap,
    honors,
    collegeCredit,
    capstone,
    skinny,
    newCourse,
    pathway,
    gradRequirement,
    page = 1,
    pageSize = 24,
  } = filters;

  const terms = (q ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  let matched: Array<{ doc: SearchDoc; score: number }> = [];
  for (const doc of getDocs()) {
    const c = doc.course;
    if (department && !c.departments.includes(department)) continue;
    if (grade && !c.grades_allowed.includes(grade)) continue;
    if (ap && !c.flags.ap) continue;
    if (honors && !c.flags.honors) continue;
    if (collegeCredit && !c.college_credit_available) continue;
    if (capstone && !c.flags.capstone) continue;
    if (skinny && !c.flags.skinny) continue;
    if (newCourse && !c.flags.new_course) continue;
    if (pathway && !c.pathways.includes(pathway)) continue;
    if (gradRequirement && c.graduation_requirements_fulfilled_raw.length === 0)
      continue;

    let score = 1;
    if (terms.length > 0) {
      score = relevance(doc, terms);
      if (score === 0) continue;
    }
    matched.push({ doc, score });
  }

  matched.sort(
    (a, b) =>
      b.score - a.score || a.doc.course.title.localeCompare(b.doc.course.title),
  );

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = matched
    .slice((safePage - 1) * pageSize, safePage * pageSize)
    .map((m) => m.doc.course);

  return { items, total, page: safePage, pageSize, totalPages };
}
