"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import clsx from "clsx";
import { MOBILE_MORE, isNavActive } from "./nav-config";

/**
 * Mobile "More" slide-up sheet. Holds the secondary destinations that don't fit
 * the five-item tab bar. Focus is trapped while open, Escape closes it, and the
 * backdrop is dismissible. Rendered only on mobile (lg:hidden).
 */
export function MoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on route change.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
      <div
        className="absolute inset-0 animate-fade-in bg-ep-coal/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
        className="pb-safe absolute inset-x-0 bottom-0 animate-slide-up-sheet rounded-t-2xl border-t border-ep-border bg-ep-card shadow-panel"
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <span className="mx-auto h-1 w-10 -translate-y-1 rounded-full bg-ep-border" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-5 pb-2">
          <h2 className="text-base font-bold text-ep-charcoal">More</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ep-muted hover:bg-ep-bg-sunken"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2 px-4 pb-4">
          {MOBILE_MORE.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-xs font-medium transition-colors",
                    active
                      ? "border-ep-red/25 bg-ep-red-soft text-ep-red-dark"
                      : "border-ep-border-soft bg-ep-card text-ep-ink hover:bg-ep-bg-sunken",
                  )}
                >
                  <Icon
                    aria-hidden
                    className={clsx("h-6 w-6", active ? "text-ep-red" : "text-ep-faint")}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form
          action="/auth/signout"
          method="post"
          className="border-t border-ep-border-soft px-4 py-3"
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-ep-border bg-ep-card py-2.5 text-sm font-semibold text-ep-charcoal hover:bg-ep-bg-sunken"
          >
            <LogOut aria-hidden className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
