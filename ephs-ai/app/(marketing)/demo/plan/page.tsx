import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoPlanner } from "./DemoPlanner";

export const metadata: Metadata = { title: "Four-Year Plan Demo" };

/**
 * No-login preview of the four-year plan. Renders the same planner the
 * authenticated app uses, driven by the browser-only preview store so uploaded
 * transcript courses show up as completed history and edits persist locally.
 */
export default function DemoPlanPage() {
  return (
    <div className="space-y-6">
      <DemoBanner />
      <PageHeader
        kicker="Plan every term"
        title="Your four-year plan"
        lede="Completed courses from your uploaded transcript appear as history. Drag your future courses between terms, lock the ones you're sure about, and we'll check eligibility and prerequisites after every change."
      />

      <Link
        href="/demo/transcript"
        className="inline-flex items-center gap-2 rounded-lg border border-ep-border bg-ep-card px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
      >
        <Upload className="h-4 w-4 text-ep-red" aria-hidden />
        Upload a transcript
      </Link>

      <Suspense
        fallback={<p className="text-sm text-ep-muted">Loading your preview plan…</p>}
      >
        <DemoPlanner />
      </Suspense>
    </div>
  );
}
