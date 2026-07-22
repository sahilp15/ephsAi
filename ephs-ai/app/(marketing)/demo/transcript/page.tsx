import type { Metadata } from "next";
import Link from "next/link";
import { getEnv } from "@/lib/env";
import { PageHeader, CounselorVerificationNotice } from "@/components/ui";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoTranscriptUploader } from "./DemoTranscriptUploader";

export const metadata: Metadata = { title: "Upload Transcript Demo" };

/**
 * No-login preview of the transcript upload. Renders the same uploader the
 * authenticated flow uses and runs the real extraction + catalog-matching
 * pipeline, but nothing is stored server-side: the matched courses are held in
 * the browser and confirmed into the preview four-year plan. Lets reviewers
 * test the full transcript-to-plan experience while sign-in approval pends.
 */
export default function DemoTranscriptPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <DemoBanner />

      <PageHeader
        kicker="Import your history"
        title="Upload your transcript"
        lede="We'll read your completed courses, match them to the EPHS catalog, and add them to your four-year plan. In this preview nothing is saved to a server; your courses stay in this browser only."
      />

      <section aria-label="Upload">
        <DemoTranscriptUploader maxMb={getEnv().MAX_TRANSCRIPT_UPLOAD_MB} />
      </section>

      <section className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ep-faint">
          Prefer to skip the upload?
        </h2>
        <p className="mt-1 text-sm text-ep-muted">
          You can jump straight to the preview four-year plan and add courses by
          hand.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/demo/plan"
            className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
          >
            Go to the preview plan
          </Link>
          <Link
            href="/demo/dashboard"
            className="rounded-lg border border-ep-border bg-ep-card px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
          >
            Back to dashboard
          </Link>
        </div>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
