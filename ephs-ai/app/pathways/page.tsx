import type { Metadata } from "next";
import Link from "next/link";
import { getDataset, getPathways } from "@/lib/catalog/store";
import { SourceCitation } from "@/components/ui";

export const metadata: Metadata = { title: "Pathways" };

export default function PathwaysPage() {
  const overview = getDataset().pathway_overview;
  const pathways = getPathways();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ep-charcoal">EPHS Pathways</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ep-ink">
          {overview.description}
        </p>
        <SourceCitation pages={[overview.source_page]} className="mt-2" />
      </div>

      <section aria-label="Pathway benefits" className="rounded-xl border border-ep-border-soft bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ep-faint">
          Benefits (from the official Pathways page)
        </h2>
        <ul className="mt-2 grid list-inside list-disc gap-1.5 text-sm text-ep-ink sm:grid-cols-2">
          {overview.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <ul className="grid gap-4 md:grid-cols-2">
        {pathways.map((p) => (
          <li key={p.id}>
            <Link
              href={`/pathways/${p.id}`}
              className="group block h-full rounded-xl border border-ep-border-soft bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <h2 className="text-lg font-bold text-ep-charcoal group-hover:text-ep-red-dark">
                {p.name}
              </h2>
              <p className="mt-1.5 text-sm text-ep-muted">{p.description}</p>
              <p className="mt-3 text-xs font-medium text-ep-faint">
                {p.capstones.length} capstone
                {p.capstones.length === 1 ? "" : "s"} ·{" "}
                {p.supporting_courses.length} supporting courses
              </p>
              <SourceCitation pages={p.source_pages} className="mt-2" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
