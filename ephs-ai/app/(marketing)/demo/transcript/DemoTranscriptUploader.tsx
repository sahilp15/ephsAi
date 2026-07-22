"use client";

import { useRouter } from "next/navigation";
import {
  TranscriptUploader,
  type UploadResponse,
} from "@/components/transcript/TranscriptUploader";

export const DEMO_TRANSCRIPT_KEY_PREFIX = "ephs-ai:demo:transcript:";

/**
 * Preview wrapper around the real `TranscriptUploader`. Instead of the
 * authenticated route's "store the file, then open the saved transcript" flow,
 * it posts to the no-login demo endpoint, stashes the returned rows in
 * sessionStorage, and routes to the demo review screen. The uploader UI and
 * validation are identical to the signed-in experience.
 */
export function DemoTranscriptUploader({ maxMb }: { maxMb: number }) {
  const router = useRouter();

  function handleUploaded(data: UploadResponse) {
    try {
      sessionStorage.setItem(
        `${DEMO_TRANSCRIPT_KEY_PREFIX}${data.id}`,
        JSON.stringify(data),
      );
    } catch {
      /* sessionStorage unavailable - the review page will show an empty state */
    }
    router.push(`/demo/transcript/${data.id}`);
  }

  return (
    <TranscriptUploader
      maxMb={maxMb}
      uploadUrl="/api/demo/transcript/upload"
      onUploaded={handleUploaded}
    />
  );
}
