import type { Metadata } from "next";
import Link from "next/link";
import { getCourseMetaList } from "@/lib/catalog/meta";
import { PageHeader, CounselorVerificationNotice } from "@/components/ui";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoTranscriptReview } from "./DemoTranscriptReview";

export const metadata: Metadata = { title: "Review Transcript Demo" };

/**
 * No-login preview of the transcript review screen. The catalog is loaded
 * server-side (public data) and passed to the client review component, which
 * reads the uploaded rows from the browser and confirms them into the preview
 * four-year plan.
 */
export default function DemoTranscriptReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const catalog = getCourseMetaList().map((m) => ({
    id: m.id,
    title: m.title,
    department: m.department,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <DemoBanner />
      <div>
        <Link
          href="/demo/transcript"
          className="text-sm font-semibold text-ep-muted hover:text-ep-charcoal"
        >
          ← Back to upload
        </Link>
      </div>
      <PageHeader
        kicker="Review & confirm"
        title="Confirm your courses"
        lede="Check each course and its EPHS match. Fix anything that's off, mark transfers or in-progress courses, then confirm. Nothing updates your plan until you confirm."
      />

      <DemoTranscriptReview transcriptId={params.id} catalog={catalog} />

      <CounselorVerificationNotice />
    </div>
  );
}
