import type { Metadata } from "next";
import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { listTranscripts, listAcademicRecords } from "@/lib/data/academic";
import { getEnv } from "@/lib/env";
import { TranscriptUploader } from "@/components/transcript/TranscriptUploader";
import { TranscriptList, type TranscriptListItem } from "@/components/transcript/TranscriptList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, CounselorVerificationNotice } from "@/components/ui";

export const metadata: Metadata = { title: "Transcript" };
export const dynamic = "force-dynamic";

export default async function TranscriptPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const user = await requireStudent();
  const [transcripts, records] = await Promise.all([
    listTranscripts(user.id),
    listAcademicRecords(user.id),
  ]);

  // Row counts per transcript (one small query).
  const supabase = createSupabaseServerClient();
  const counts = new Map<string, number>();
  if (supabase && transcripts.length > 0) {
    const { data } = await supabase
      .from("transcript_extracted_rows")
      .select("transcript_id")
      .in("transcript_id", transcripts.map((t) => t.id));
    for (const row of data ?? []) {
      counts.set(row.transcript_id, (counts.get(row.transcript_id) ?? 0) + 1);
    }
  }

  const items: TranscriptListItem[] = transcripts.map((t) => ({
    id: t.id,
    originalFilename: t.original_filename,
    status: t.status,
    uploadedAt: t.uploaded_at,
    rowCount: counts.get(t.id) ?? 0,
  }));

  const fromOnboarding = searchParams.from === "onboarding";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        kicker="Import your history"
        title="Upload your transcript"
        lede="We'll read your completed courses, match them to the EPHS catalog, and add them to your four-year plan so you don't have to re-enter your history."
      />

      <section aria-label="Upload">
        <TranscriptUploader maxMb={getEnv().MAX_TRANSCRIPT_UPLOAD_MB} />
      </section>

      {items.length > 0 ? (
        <section aria-label="Your transcripts" className="space-y-3">
          <h2 className="text-lg font-bold text-ep-charcoal">Your uploads</h2>
          <TranscriptList items={items} />
        </section>
      ) : null}

      <section className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ep-faint">
          Prefer to skip the upload?
        </h2>
        <p className="mt-1 text-sm text-ep-muted">
          You can add completed or in-progress courses by hand anytime, and
          {records.length > 0 ? (
            <> you already have {records.length} course{records.length === 1 ? "" : "s"} in your history.</>
          ) : (
            <> start building your plan right away.</>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/plan"
            className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
          >
            Go to my four-year plan
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-ep-border bg-ep-card px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg-sunken"
          >
            {fromOnboarding ? "Skip for now" : "Back to dashboard"}
          </Link>
        </div>
      </section>

      <CounselorVerificationNotice />
    </div>
  );
}
