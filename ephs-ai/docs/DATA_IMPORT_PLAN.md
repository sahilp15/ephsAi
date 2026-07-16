# Data Import Plan

## Dataset lifecycle

1. **Origin.** The district publishes the official Course Guide PDF. A
   structured extraction produces `data/ephs-course-guide-2026-27.json`
   (schema 1.0.0), which pins the source PDF's SHA-256 and preserves raw page
   text for auditability.
2. **Validation.** `npm run data:audit` validates the dataset (required
   fields, duplicate IDs, page-reference bounds, unresolved pathway names,
   cross-listings) and regenerates `docs/DATA_AUDIT.md`. It exits non-zero on
   schema problems.
3. **Serving (MVP).** The app serves the dataset directly from
   `lib/catalog/store.ts` — read-only, indexed in memory, never shipped whole
   to the browser.
4. **Serving (hosted).** `npm run data:import` loads the same dataset into
   Supabase Postgres for the production path.

## `npm run data:import` — behavior

- **Idempotent.** Each guide version is keyed by the source PDF SHA-256.
  Re-running with the same file refreshes that version's rows
  (`resolution=merge-duplicates` upserts); nothing is duplicated.
- **Versioned.** New PDFs create new `course_guide_versions` rows. Older
  versions remain queryable for audit/history.
- **Explicit activation.** The newly imported version is activated at the end
  (single active version enforced by a partial unique index). Pass
  `--no-activate` to stage a version for admin review first.
- **Trusted context only.** Requires `SUPABASE_SERVICE_ROLE_KEY`; run it from
  a developer machine or CI secret context, never from the browser.

### What gets imported

| Dataset section | Tables |
| --- | --- |
| Courses (+appearances, pages, aliases, flags, departments) | `courses`, `course_source_appearances`, `course_source_pages`, `course_aliases`, `course_flags`, `course_departments` |
| Pathways (markers preserved verbatim) | `pathways`, `pathway_capstones`, `pathway_supporting_courses`, `pathway_external_or_unresolved_courses` |
| Graduation rules (2027 vs 2028+), arts list | `graduation_rule_sets`, `graduation_rules`, `arts_requirement_courses` |
| Programs (EP Online, PSEO, CTC, Special Services, AVID) | `school_programs` |
| Raw page text | `guide_source_pages` |
| Version metadata + summary | `course_guide_versions`, `admin_import_jobs` |

## Future guide years

Drop the new JSON into `data/`, run `data:audit`, review `/admin`, then
`data:import -- --no-activate`, preview, and activate. Arbitrary
PDF-to-production import without administrator review is intentionally not
supported.
