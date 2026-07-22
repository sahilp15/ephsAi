"use client";

import { useState } from "react";
import { useStudent } from "@/lib/client/student-context";

export function ClearDataButton() {
  const { clearAll } = useStudent();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="mt-3 text-sm font-medium text-ep-success">
        All planning data has been removed from this browser.
      </p>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => {
              clearAll();
              try {
                window.localStorage.removeItem("ephs-ai:recommendations:v1");
                window.localStorage.removeItem("ephs-ai:chat:v1");
              } catch {
                /* ignore */
              }
              setDone(true);
            }}
            className="rounded-lg bg-ep-red px-4 py-2 text-sm font-semibold text-white hover:bg-ep-red-dark"
          >
            Yes, delete everything
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-ep-border bg-ep-card px-4 py-2 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-ep-red px-4 py-2 text-sm font-semibold text-ep-red-dark hover:bg-ep-red-soft"
        >
          Delete my planning data
        </button>
      )}
    </div>
  );
}
