import type { Metadata } from "next";
import { adminListEquivalencies } from "@/lib/data/admin";
import { getCourseMetaList } from "@/lib/catalog/meta";
import { EquivalencyManager } from "@/components/admin/EquivalencyManager";

export const metadata: Metadata = { title: "Admin · Course Mappings" };
export const dynamic = "force-dynamic";

export default async function AdminMappingsPage() {
  const equivalencies = await adminListEquivalencies();
  const catalog = getCourseMetaList().map((m) => ({ id: m.id, title: m.title }));
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ep-charcoal">Course mappings &amp; equivalencies</h2>
        <p className="mt-0.5 text-sm text-ep-muted">
          Improve transcript matching by mapping non-standard course names to the
          EPHS catalog. These are applied when transcripts are processed.
        </p>
      </div>
      <EquivalencyManager initial={equivalencies} catalog={catalog} />
    </div>
  );
}
