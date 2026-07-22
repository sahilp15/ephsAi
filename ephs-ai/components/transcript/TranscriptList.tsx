"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2 } from "lucide-react";
import type { TranscriptStatus } from "@/lib/supabase/types";

export interface TranscriptListItem {
  id: string;
  originalFilename: string;
  status: TranscriptStatus;
  uploadedAt: string;
  rowCount: number;
}

const STATUS_LABEL: Record<TranscriptStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing…",
  processed: "Ready to review",
  failed: "Could not read",
  confirmed: "Confirmed",
};
const STATUS_STYLE: Record<TranscriptStatus, string> = {
  uploaded: "bg-ep-bg text-ep-muted",
  processing: "bg-ep-warn-soft text-ep-warn",
  processed: "bg-ep-red-soft text-ep-red-dark",
  failed: "bg-ep-red-soft text-ep-red-dark",
  confirmed: "bg-ep-success-soft text-ep-success",
};

export function TranscriptList({ items }: { items: TranscriptListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function del(id: string, mode: "file" | "file_and_records") {
    setPendingId(id);
    await fetch(`/api/transcript/${id}?mode=${mode}`, { method: "DELETE" });
    setPendingId(null);
    setConfirmId(null);
    router.refresh();
  }

  if (items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li
          key={t.id}
          className="rounded-xl border border-ep-border-soft bg-ep-card p-3 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-ep-red" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ep-charcoal">
                  {t.originalFilename}
                </p>
                <p className="text-xs text-ep-faint">
                  {new Date(t.uploadedAt).toLocaleDateString()} · {t.rowCount} course
                  {t.rowCount === 1 ? "" : "s"} detected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[t.status]}`}
              >
                {STATUS_LABEL[t.status]}
              </span>
              {(t.status === "processed" || t.status === "confirmed" || t.status === "failed") && (
                <Link
                  href={`/transcript/${t.id}`}
                  className="rounded-md border border-ep-border px-3 py-1.5 text-xs font-semibold text-ep-charcoal hover:bg-ep-bg"
                >
                  {t.status === "confirmed" ? "Re-review" : "Review"}
                </Link>
              )}
              <button
                type="button"
                onClick={() => setConfirmId(confirmId === t.id ? null : t.id)}
                className="rounded-md p-1.5 text-ep-faint hover:text-ep-red-dark"
                aria-label="Delete transcript"
              >
                {pendingId === t.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {confirmId === t.id ? (
            <div className="mt-3 rounded-lg border border-ep-border-soft bg-ep-bg/60 p-3 text-sm">
              <p className="font-semibold text-ep-charcoal">Delete this transcript?</p>
              <p className="mt-0.5 text-xs text-ep-muted">
                Choose whether to keep the academic history you confirmed from it.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => del(t.id, "file")}
                  className="rounded-lg border border-ep-border bg-ep-card px-3 py-1.5 text-xs font-semibold text-ep-charcoal hover:bg-ep-bg-sunken"
                >
                  Remove file only (keep courses)
                </button>
                <button
                  type="button"
                  onClick={() => del(t.id, "file_and_records")}
                  className="rounded-md bg-ep-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ep-red-dark"
                >
                  Remove file &amp; its courses
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-ep-muted hover:text-ep-charcoal"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
