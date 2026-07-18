"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, ShieldCheck, X } from "lucide-react";

const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg"];
const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

type Phase = "idle" | "uploading" | "processing" | "error";

export function TranscriptUploader({ maxMb }: { maxMb: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function validate(file: File): string | null {
    const okType =
      ACCEPTED_MIME.includes(file.type) ||
      ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!okType) return "Please choose a PDF, PNG, JPG, or JPEG file.";
    if (file.size === 0) return "That file appears to be empty.";
    if (file.size > maxMb * 1024 * 1024) return `Files must be ${maxMb} MB or smaller.`;
    return null;
  }

  function upload(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      setPhase("error");
      return;
    }
    setError(null);
    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);

    const body = new FormData();
    body.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/transcript/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setPhase("processing");
        try {
          const data = JSON.parse(xhr.responseText) as { id: string };
          router.push(`/transcript/${data.id}`);
        } catch {
          setError("Upload finished but we couldn't read the response.");
          setPhase("error");
        }
      } else {
        let message = "Upload failed. Please try again.";
        try {
          message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message;
        } catch {
          /* keep default */
        }
        setError(message);
        setPhase("error");
      }
    };
    xhr.onerror = () => {
      setError("A network error interrupted the upload. Please try again.");
      setPhase("error");
    };
    xhr.send(body);
  }

  const busy = phase === "uploading" || phase === "processing";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) upload(file);
        }}
        aria-label="Upload transcript"
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-ep-red bg-ep-red-soft"
            : "border-ep-border bg-white hover:border-ep-red/50"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        {busy ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-ep-red" aria-hidden />
            <p className="mt-3 font-display text-lg font-bold uppercase text-ep-charcoal">
              {phase === "uploading" ? "Uploading…" : "Reading your transcript…"}
            </p>
            {phase === "uploading" ? (
              <div className="mt-3 h-2 w-56 overflow-hidden rounded-full bg-ep-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ep-red-dark to-ep-red transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-ep-muted">This can take a few seconds.</p>
            )}
            {fileName ? <p className="mt-2 text-xs text-ep-faint">{fileName}</p> : null}
          </>
        ) : (
          <>
            <FileUp className="h-8 w-8 text-ep-red" aria-hidden />
            <p className="mt-3 font-display text-lg font-bold uppercase text-ep-charcoal">
              Drag &amp; drop your transcript
            </p>
            <p className="mt-1 text-sm text-ep-muted">
              or click to choose a file · PDF, PNG, JPG, JPEG · up to {maxMb} MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-r-lg border-l-4 border-ep-red bg-ep-red-soft p-3 text-sm text-ep-red-dark"
        >
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-ep-bg px-3 py-2.5 text-xs text-ep-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-ep-faint" aria-hidden />
        <p>
          Your transcript is a private student record. We use it only to identify
          completed courses, earned credits, prerequisites, and graduation
          progress. It&apos;s stored privately and visible only to you and
          authorized administrators — never on a public link.
        </p>
      </div>
    </div>
  );
}
