"use client";

import { useEffect, useId, useRef } from "react";
import {
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";
import type { Club } from "@/lib/clubs/types";

/** Safe email test: only render a mailto: link for plausible addresses. */
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Only treat http(s) URLs as external links. */
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function NotListed() {
  return <span className="italic text-ep-faint">Not listed</span>;
}

/** A labelled definition row. */
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ep-faint">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ep-ink">{children}</dd>
    </div>
  );
}

export function ClubDetailModal({
  club,
  onClose,
}: {
  club: Club;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the close button on open and restore focus to the trigger on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  // Lock body scroll while the dialog is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Escape to close + simple focus trap keeping Tab within the dialog.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const meetingDays =
    club.meetingDays.length > 0 ? club.meetingDays.join(", ") : null;
  const grades = club.grades.length > 0 ? club.grades.join(", ") : null;
  const leaders =
    club.studentLeaders.length > 0 ? club.studentLeaders.join(", ") : null;

  const email = club.contactEmail && isEmail(club.contactEmail) ? club.contactEmail : null;
  const website = club.website && isHttpUrl(club.website) ? club.website : null;
  const registration =
    club.registrationUrl && isHttpUrl(club.registrationUrl)
      ? club.registrationUrl
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ep-coal/60 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        // Close only when the backdrop itself (not the panel) is pressed.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden bg-ep-card shadow-panel sm:max-h-[90vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ep-border-soft bg-ep-card px-5 py-4">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-md bg-ep-charcoal px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
              {club.category}
            </span>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-bold leading-tight tracking-tight text-ep-charcoal"
            >
              {club.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-md p-1.5 text-ep-muted transition-colors hover:bg-ep-bg hover:text-ep-charcoal"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div>
            <p className="text-sm leading-relaxed text-ep-ink">
              {club.description}
            </p>
            {club.descriptionSource === "general" ? (
              <p className="mt-2 inline-flex rounded bg-ep-bg px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ep-muted">
                Plain-language summary — not official wording
              </p>
            ) : null}
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Advisor" icon={<User aria-hidden className="h-3 w-3" />}>
              {club.advisor ?? <NotListed />}
            </Field>
            <Field label="Student leaders" icon={<Users aria-hidden className="h-3 w-3" />}>
              {leaders ?? <NotListed />}
            </Field>
            <Field label="Meeting days" icon={<CalendarDays aria-hidden className="h-3 w-3" />}>
              {meetingDays ?? <NotListed />}
            </Field>
            <Field label="Meeting time">
              {club.meetingTime ?? <NotListed />}
            </Field>
            <Field label="Frequency">
              {club.meetingFrequency ?? <NotListed />}
            </Field>
            <Field label="Location" icon={<MapPin aria-hidden className="h-3 w-3" />}>
              {club.location ?? <NotListed />}
            </Field>
            <Field label="Eligible grades">
              {grades ? `Grades ${grades}` : <NotListed />}
            </Field>
            <Field label="Category">{club.category}</Field>
          </dl>

          <dl className="mt-5 space-y-4 border-t border-ep-border-soft pt-5">
            <Field label="Membership requirements">
              {club.membershipRequirements ?? <NotListed />}
            </Field>
            <Field label="How to join">
              {club.joinInstructions ?? <NotListed />}
            </Field>
            <Field label="Additional notes">
              {club.additionalNotes ?? <NotListed />}
            </Field>
          </dl>

          {/* Contact & links */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-ep-border-soft pt-5">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-ep-card px-3 py-1.5 text-sm font-medium text-ep-charcoal transition-colors hover:border-ep-red hover:text-ep-red-dark"
              >
                <Mail aria-hidden className="h-3.5 w-3.5" />
                {email}
              </a>
            ) : null}
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-ep-card px-3 py-1.5 text-sm font-medium text-ep-charcoal transition-colors hover:border-ep-red hover:text-ep-red-dark"
              >
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                Website
              </a>
            ) : null}
            {registration ? (
              <a
                href={registration}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ep-red px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ep-red-dark"
              >
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                Register
              </a>
            ) : null}
          </div>
        </div>

        {/* Footer: source */}
        <div className="border-t border-ep-border-soft bg-ep-bg px-5 py-3">
          <p className="font-mono text-[11px] text-ep-faint">
            {isHttpUrl(club.sourceUrl) ? (
              <a
                href={club.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline decoration-ep-border underline-offset-2 hover:text-ep-red-dark"
              >
                <ExternalLink aria-hidden className="h-3 w-3" />
                Official source
              </a>
            ) : (
              <span>Source: {club.sourceUrl}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
