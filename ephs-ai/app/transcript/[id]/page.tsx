import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { getTranscriptForStudent } from "@/lib/data/academic";
import { getCourseMetaList } from "@/lib/catalog/meta";
import {
  TranscriptReview,
  type ReviewRowInit,
} from "@/components/transcript/TranscriptReview";
import { PageHeader, CounselorVerificationNotice, WarningBanner } from "@/components/ui";
import type { MatchConfidence } from "@/lib/domain/transcript-match";

export const metadata: Metadata = { title: "Review Transcript" };
export const dynamic = "force-dynamic";

export default async function TranscriptReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireStudent();
  const data = await getTranscriptForStudent(user.id, params.id);
  if (!data) notFound();

  const { transcript, rows } = data;

  const initialRows: ReviewRowInit[] = rows.map((r) => ({
    rowId: r.id,
    rawName: r.raw_course_name,
    originalCourseName: r.raw_course_name,
    courseId: r.matched_course_id,
    recordType: r.in_progress
      ? "in_progress"
      : r.is_transfer
        ? "transfer"
        : "completed",
    gradeLevel: r.grade_level,
    term: r.term,
    finalGrade: r.final_grade,
    creditsEarned: r.credits_earned,
    isHonors: r.is_honors,
    isAp: r.is_ap,
    isTransfer: r.is_transfer,
    confidence: (r.confirmed ? "confirmed" : r.match_confidence) as MatchConfidence | "confirmed",
  }));

  const catalog = getCourseMetaList().map((m) => ({
    id: m.id,
    title: m.title,
    department: m.department,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/transcript" className="text-sm font-semibold text-ep-muted hover:text-ep-charcoal">
          ← Back to transcripts
        </Link>
      </div>
      <PageHeader
        kicker="Review & confirm"
        title="Confirm your courses"
        lede="Check each course and its EPHS match. Fix anything that's off, mark transfers or in-progress courses, then confirm. Nothing updates your plan until you confirm."
      />

      {transcript.status === "failed" ? (
        <WarningBanner severity="warning" title="We couldn't read this transcript automatically">
          You can still add your courses by hand below, then confirm.
        </WarningBanner>
      ) : null}

      {transcript.status === "confirmed" ? (
        <WarningBanner severity="info" title="Already confirmed">
          You confirmed this transcript. You can make changes and confirm again;
          your academic history will be updated.
        </WarningBanner>
      ) : null}

      <TranscriptReview
        transcriptId={transcript.id}
        initialRows={initialRows}
        catalog={catalog}
        warning={transcript.error_message}
      />

      <CounselorVerificationNotice />
    </div>
  );
}
