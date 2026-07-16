#!/usr/bin/env node
/**
 * Idempotent import of data/ephs-course-guide-2026-27.json into Supabase
 * Postgres. Safe to re-run: each dataset version is keyed by the source PDF's
 * SHA-256; re-importing the same file replaces that version's rows and leaves
 * other versions untouched. Activation is explicit.
 *
 * Requires (server-side only — never expose these to a browser):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run data:import              # import (or refresh) and activate
 *   npm run data:import -- --no-activate
 */
import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "The app runs fine without Supabase (catalog served from the versioned dataset); this\n" +
      "import is only needed for the hosted-Postgres production path. See docs/DATA_IMPORT_PLAN.md.",
  );
  process.exit(1);
}

const activate = !process.argv.includes("--no-activate");
const dataFile = path.join(process.cwd(), "data", "ephs-course-guide-2026-27.json");
const d = JSON.parse(fs.readFileSync(dataFile, "utf8"));

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function rest(pathname, options = {}) {
  const res = await fetch(`${url}/rest/v1/${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method ?? "GET"} ${pathname} → ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function upsert(table, rows, onConflict) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await rest(`${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows.slice(i, i + chunkSize)),
    });
  }
}

async function main() {
  console.log(`Importing ${d.dataset_id} (${d.courses.length} courses)…`);

  // 1. Guide version keyed by source sha (idempotency anchor).
  const existing = await rest(
    `course_guide_versions?source_sha256=eq.${d.generated_from.pdf_sha256}&select=id`,
  );
  let versionId = existing?.[0]?.id;
  if (!versionId) {
    const created = await rest("course_guide_versions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        dataset_id: d.dataset_id,
        schema_version: d.schema_version,
        academic_year: "2026-27",
        source_filename: d.generated_from.filename,
        source_sha256: d.generated_from.pdf_sha256,
        is_active: false,
        import_summary: {},
      }),
    });
    versionId = created[0].id;
    console.log(`Created guide version ${versionId}`);
  } else {
    console.log(`Refreshing existing guide version ${versionId}`);
  }
  const v = { guide_version_id: versionId };

  // 2. Courses and related rows.
  await upsert(
    "courses",
    d.courses.map((c) => ({
      ...v,
      id: c.id,
      title: c.title,
      primary_department: c.primary_department,
      description: c.description ?? "",
      prerequisite_raw: c.prerequisite_raw,
      grades_raw: c.grades_raw,
      grades_allowed: c.grades_allowed,
      credits_raw: c.credits_raw,
      term_length_interpretation: c.term_length_interpretation,
      college_credit_available: c.college_credit_available,
      college_credit_raw: c.college_credit_raw,
      flags: c.flags,
      notes: c.notes,
      graduation_requirement_statements: c.graduation_requirements_fulfilled_raw,
      data_quality: c.data_quality,
      raw_titles_seen: c.raw_titles_seen,
    })),
    "guide_version_id,id",
  );

  await upsert(
    "course_departments",
    d.courses.flatMap((c) =>
      c.departments.map((dep) => ({ ...v, course_id: c.id, department: dep })),
    ),
    "guide_version_id,course_id,department",
  );

  await upsert(
    "course_source_appearances",
    d.courses.flatMap((c) =>
      c.source_appearances.map((a) => ({
        ...v,
        appearance_id: a.appearance_id,
        course_id: c.id,
        raw_title: a.raw_title,
        title: a.title,
        department: a.department,
        source_page: a.source_page,
        source_column: a.source_column,
        payload: a,
      })),
    ),
    "guide_version_id,appearance_id",
  );

  await upsert(
    "course_source_pages",
    d.courses.flatMap((c) =>
      c.source_pages.map((p) => ({ ...v, course_id: c.id, source_page: p })),
    ),
    "guide_version_id,course_id,source_page",
  );

  await upsert(
    "course_aliases",
    d.courses.flatMap((c) =>
      [...new Set([c.title, ...c.raw_titles_seen])].map((alias) => ({
        ...v,
        course_id: c.id,
        alias,
      })),
    ),
    "guide_version_id,course_id,alias",
  );

  await upsert(
    "course_flags",
    d.courses.flatMap((c) =>
      Object.entries(c.flags)
        .filter(([, on]) => on)
        .map(([flag]) => ({ ...v, course_id: c.id, flag })),
    ),
    "guide_version_id,course_id,flag",
  );

  // 3. Pathways.
  const courseIds = new Set(d.courses.map((c) => c.id));
  await upsert(
    "pathways",
    d.pathways.map((p) => ({
      ...v,
      id: p.id,
      name: p.name,
      description: p.description,
      source_pages: p.source_pages,
    })),
    "guide_version_id,id",
  );
  await upsert(
    "pathway_capstones",
    d.pathways.flatMap((p) =>
      p.capstones.map((c) => ({
        ...v,
        pathway_id: p.id,
        name: c.name,
        raw_entry: c.raw_entry,
        markers_raw: c.markers_raw,
        resolved_course_id: null,
      })),
    ),
    "guide_version_id,pathway_id,raw_entry",
  );
  await upsert(
    "pathway_supporting_courses",
    d.pathways.flatMap((p) =>
      p.supporting_courses.map((c) => ({
        ...v,
        pathway_id: p.id,
        name: c.name,
        raw_entry: c.raw_entry,
        markers_raw: c.markers_raw,
        resolved_course_id: null,
      })),
    ),
    "guide_version_id,pathway_id,raw_entry",
  );
  await upsert(
    "pathway_external_or_unresolved_courses",
    d.pathways.flatMap((p) =>
      p.unresolved_or_external_course_names
        .filter((n) => !courseIds.has(n))
        .map((n) => ({ ...v, pathway_id: p.id, name: n })),
    ),
    "guide_version_id,pathway_id,name",
  );

  // 4. Graduation rules, arts requirement, programs, source pages.
  await upsert(
    "graduation_rule_sets",
    [
      {
        ...v,
        id: "class_of_2027",
        label: "Class of 2027",
        source_page: d.graduation_rules.class_of_2027.source_page,
        payload: d.graduation_rules.class_of_2027,
      },
      {
        ...v,
        id: "class_of_2028_and_beyond",
        label: "Class of 2028 and beyond",
        source_page: d.graduation_rules.class_of_2028_and_beyond.source_page,
        payload: d.graduation_rules.class_of_2028_and_beyond,
      },
    ],
    "guide_version_id,id",
  );
  await upsert(
    "graduation_rules",
    [
      ...Object.entries(d.graduation_rules.class_of_2027)
        .filter(([k]) => k !== "source_page")
        .map(([rule, value]) => ({
          ...v,
          rule_set_id: "class_of_2027",
          rule,
          value,
        })),
      ...Object.entries(d.graduation_rules.class_of_2028_and_beyond)
        .filter(([k]) => k !== "source_page")
        .map(([rule, value]) => ({
          ...v,
          rule_set_id: "class_of_2028_and_beyond",
          rule,
          value,
        })),
    ],
    "guide_version_id,rule_set_id,rule",
  );
  await upsert(
    "arts_requirement_courses",
    Object.entries(
      d.graduation_rules.arts_requirement.eligible_courses_by_department,
    ).flatMap(([dept, names]) =>
      names.map((n) => ({
        ...v,
        department: dept,
        course_name: n,
        resolved_course_id: null,
      })),
    ),
    "guide_version_id,department,course_name",
  );
  await upsert(
    "school_programs",
    Object.entries(d.programs).map(([id, payload]) => ({ ...v, id, payload })),
    "guide_version_id,id",
  );
  await upsert(
    "guide_source_pages",
    d.source_pages.map((p) => ({
      ...v,
      page: p.page,
      title: p.title ?? "",
      raw_layout_text: p.raw_layout_text ?? "",
    })),
    "guide_version_id,page",
  );

  // 5. Import summary + optional activation.
  await rest(`course_guide_versions?id=eq.${versionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      import_summary: {
        courses: d.courses.length,
        appearances: d.course_appearances.length,
        pathways: d.pathways.length,
        imported_at: new Date().toISOString(),
      },
    }),
  });
  if (activate) {
    await rest(`course_guide_versions?is_active=eq.true&id=neq.${versionId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: false }),
    });
    await rest(`course_guide_versions?id=eq.${versionId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: true }),
    });
    console.log("Guide version activated.");
  }
  console.log("Import complete.");
}

main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
