import clsx from "clsx";
import { CalendarDays, MapPin, User, Users } from "lucide-react";
import type { Club } from "@/lib/clubs/types";

/** Skewed category pill, matching the CourseBadge motif. */
function ClubBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex -skew-x-12 items-center rounded-[2px] bg-ep-coal px-1.5 py-0.5 text-white">
      <span className="skew-x-12 font-mono text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </span>
    </span>
  );
}

/** Muted placeholder for any field the official source does not list. */
function NotListed() {
  return <span className="italic text-ep-faint">Not listed</span>;
}

function meetingSummary(club: Club): string | null {
  const days = club.meetingDays.length > 0 ? club.meetingDays.join(", ") : null;
  const parts = [days, club.meetingFrequency].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" · ") : null;
}

function gradeSummary(grades: string[]): string | null {
  return grades.length > 0 ? grades.join(", ") : null;
}

export function ClubCard({
  club,
  onView,
}: {
  club: Club;
  onView: () => void;
}) {
  const meeting = meetingSummary(club);
  const grades = gradeSummary(club.grades);

  return (
    <article className="flex h-full flex-col rounded-xl border border-ep-border-soft bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold leading-snug text-ep-charcoal">
          <button
            type="button"
            onClick={onView}
            className="text-left hover:text-ep-red-dark"
          >
            {club.name}
          </button>
        </h3>
        <ClubBadge label={club.category} />
      </div>

      <p className="mt-2 line-clamp-3 flex-1 text-sm text-ep-ink">
        {club.description}
      </p>

      <dl className="mt-3 space-y-1.5 text-xs text-ep-muted">
        <div className="flex items-start gap-1.5">
          <User aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ep-faint" />
          <dt className="sr-only">Advisor</dt>
          <dd>{club.advisor ?? <NotListed />}</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <CalendarDays aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ep-faint" />
          <dt className="sr-only">Meets</dt>
          <dd>{meeting ?? <NotListed />}</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ep-faint" />
          <dt className="sr-only">Location</dt>
          <dd>{club.location ?? <NotListed />}</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <Users aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ep-faint" />
          <dt className="sr-only">Eligible grades</dt>
          <dd>{grades ? `Grades ${grades}` : <NotListed />}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <button
          type="button"
          onClick={onView}
          className={clsx(
            "w-full rounded-lg border border-ep-border bg-white px-4 py-2 text-sm font-semibold text-ep-charcoal",
            "transition-colors hover:border-ep-red hover:text-ep-red-dark",
          )}
        >
          View details
        </button>
      </div>
    </article>
  );
}
