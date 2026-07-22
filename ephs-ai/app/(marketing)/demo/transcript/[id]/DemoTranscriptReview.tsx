"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TranscriptReview,
  type ReviewRowInit,
  type ConfirmRow,
} from "@/components/transcript/TranscriptReview";
import { WarningBanner } from "@/components/ui";
import { saveConfirmedRecords } from "@/lib/demo/planner-store";
import { DEMO_TRANSCRIPT_KEY_PREFIX } from "../DemoTranscriptUploader";

interface StoredUpload {
  id: string;
  filename?: string;
  rows: ReviewRowInit[];
  warnings?: string[];
}

/**
 * Preview review screen. Reads the matched rows the demo upload stashed in
 * sessionStorage and drives the real `TranscriptReview` component. Confirming
 * writes the courses into the browser-only preview plan store instead of the
 * database, then routes to the preview four-year plan.
 */
export function DemoTranscriptReview({
  transcriptId,
  catalog,
}: {
  transcriptId: string;
  catalog: { id: string; title: string; department: string }[];
}) {
  const [stored, setStored] = useState<StoredUpload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(
        `${DEMO_TRANSCRIPT_KEY_PREFIX}${transcriptId}`,
      );
      if (raw) setStored(JSON.parse(raw) as StoredUpload);
    } catch {
      /* ignore malformed / missing */
    }
    setReady(true);
  }, [transcriptId]);

  function handleConfirm(rows: ConfirmRow[]): boolean {
    saveConfirmedRecords(rows);
    return true;
  }

  if (!ready) return null;

  if (!stored) {
    return (
      <WarningBanner severity="warning" title="Nothing to review yet">
        We couldn&apos;t find an uploaded transcript for this preview session.{" "}
        <Link href="/demo/transcript" className="font-semibold underline">
          Upload a transcript
        </Link>{" "}
        to try the flow.
      </WarningBanner>
    );
  }

  const warning = stored.warnings?.[0] ?? null;

  return (
    <>
      {stored.rows.length === 0 ? (
        <WarningBanner severity="info" title="No courses detected automatically">
          We couldn&apos;t read courses from that file automatically. You can add
          them by hand below, then confirm.
        </WarningBanner>
      ) : null}
      <TranscriptReview
        transcriptId={transcriptId}
        initialRows={stored.rows}
        catalog={catalog}
        warning={warning}
        redirectTo="/demo/plan?imported=1"
        onConfirm={handleConfirm}
      />
    </>
  );
}
