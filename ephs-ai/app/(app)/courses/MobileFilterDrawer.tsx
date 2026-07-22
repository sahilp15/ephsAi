"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Mobile filter drawer. Wraps the server-rendered filter form (passed as
 * children) in an accessible slide-over: focus trapped, Escape to close,
 * dismissible backdrop, body scroll locked. Desktop uses the static rail
 * instead (this button is hidden at lg).
 */
export function MobileFilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const f = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea',
        );
        if (!f || f.length === 0) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-ep-border bg-ep-card px-3.5 text-sm font-semibold text-ep-charcoal lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-ep-red px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <div
            className="absolute inset-0 animate-fade-in bg-ep-coal/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Course filters"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm animate-slide-in-right flex-col border-l border-ep-border bg-ep-bg shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-ep-border-soft px-4 py-3">
              <h2 className="text-base font-bold text-ep-charcoal">Filters</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ep-muted hover:bg-ep-bg-sunken"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scroll-quiet flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
