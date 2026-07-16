import type { Metadata } from "next";
import { Database } from "lucide-react";
import { buildDataAudit } from "@/lib/catalog/audit";
import { StatCard, WarningBanner } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Data Audit" };

function IdList({ title, ids }: { title: string; ids: string[] }) {
  return (
    <div className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
      <h3 className="text-sm font-bold text-ep-charcoal">
        {title} <span className="font-normal text-ep-muted">({ids.length})</span>
      </h3>
      {ids.length === 0 ? (
        <p className="mt-1 text-sm text-emerald-700">None — clean.</p>
      ) : (
        <ul className="mt-1 max-h-48 list-inside list-disc overflow-y-auto text-xs text-ep-muted">
          {ids.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminPage() {
  const audit = buildDataAudit();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ep-charcoal">
          <Database aria-hidden className="h-6 w-6 text-ep-red" />
          Data Audit &amp; Guide Version
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ep-muted">
          Integrity report for the active course-guide dataset. In production
          this page is admin-only and also shows import jobs and version
          activation (see supabase/migrations).
        </p>
      </div>

      <section aria-label="Active guide version" className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ep-faint">
          Active guide version
        </h2>
        <dl className="mt-2 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ep-charcoal">Dataset</dt>
            <dd className="text-ep-muted">{audit.datasetId} (schema {audit.schemaVersion})</dd>
          </div>
          <div>
            <dt className="font-semibold text-ep-charcoal">Source document</dt>
            <dd className="text-ep-muted">{audit.sourceFilename} ({audit.pageCount} pages)</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-ep-charcoal">Source PDF SHA-256</dt>
            <dd className="break-all font-mono text-xs text-ep-muted">{audit.sourceSha256}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Counts" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Courses" value={audit.courseCount} />
        <StatCard label="Source appearances" value={audit.appearanceCount} />
        <StatCard label="Departments" value={audit.departmentCount} />
        <StatCard label="Cross-listed courses" value={audit.crossListedCourses.length} />
        <StatCard label="AP courses" value={audit.flagCounts.ap ?? 0} />
        <StatCard label="Honors courses" value={audit.flagCounts.honors ?? 0} />
        <StatCard label="Capstones" value={audit.flagCounts.capstone ?? 0} />
        <StatCard label="College credit" value={audit.flagCounts.college_credit ?? 0} />
      </section>

      <section aria-label="Data quality" className="grid gap-4 md:grid-cols-2">
        <IdList title="Courses missing descriptions" ids={audit.coursesMissingDescription} />
        <IdList title="Courses missing grade data" ids={audit.coursesMissingGrades} />
        <IdList title="Courses missing credit data" ids={audit.coursesMissingCredits} />
        <IdList title="Courses with source conflicts" ids={audit.coursesWithConflicts} />
        <IdList title="Invalid source-page references" ids={audit.invalidSourcePageRefs} />
        <IdList title="Cross-listed (multiple appearances)" ids={audit.crossListedCourses} />
      </section>

      <section aria-label="Unresolved pathway names" className="space-y-3">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Pathway course names not resolved to catalog entries
        </h2>
        <p className="text-sm text-ep-muted">
          These names are preserved exactly as printed on the guide&apos;s
          pathway pages (often external courses, course groups, or entries with
          undefined markers). They are shown to students as-is, never invented.
        </p>
        {audit.unresolvedPathwayNames.map((p) => (
          <div key={p.pathway} className="rounded-xl border border-ep-border-soft bg-white p-4 shadow-card">
            <h3 className="text-sm font-bold text-ep-charcoal">
              {p.pathway} <span className="font-normal text-ep-muted">({p.names.length})</span>
            </h3>
            {p.names.length === 0 ? (
              <p className="mt-1 text-sm text-emerald-700">All names resolved.</p>
            ) : (
              <ul className="mt-1 list-inside list-disc text-xs text-ep-muted">
                {p.names.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section aria-label="Known limitations">
        <h2 className="text-lg font-bold text-ep-charcoal">
          Known limitations (from the dataset)
        </h2>
        <ul className="mt-2 space-y-2">
          {audit.knownLimitations.map((l) => (
            <li key={l}>
              <WarningBanner severity="info">{l}</WarningBanner>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
