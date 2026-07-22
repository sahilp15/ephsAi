"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ListChecks, X } from "lucide-react";
import clsx from "clsx";
import { useStudent } from "@/lib/client/student-context";

const DISMISS_KEY = "ephs-ai:setup-dismissed:v1";

/**
 * Post-onboarding setup checklist — adapts `@chowlol202/onboarding-checklist`.
 * Each item reflects real stored state (profile, transcript, plan) rather than
 * a scripted tutorial. It collapses to a slim banner once every item is done
 * and can be dismissed permanently. Never blocks the dashboard.
 */
export function SetupChecklist({ hasTranscript }: { hasTranscript: boolean }) {
  const { profile, plan, ready } = useStudent();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const items = useMemo(
    () => [
      {
        label: "Complete your student profile",
        done: profile.onboardingCompleted,
        href: "/onboarding",
      },
      {
        label: "Upload and confirm your transcript",
        done: hasTranscript || profile.completedCourseIds.length > 0,
        href: "/transcript",
      },
      {
        label: "Explore a pathway",
        done: profile.pathwayIds.length > 0,
        href: "/pathways",
      },
      {
        label: "Add a course to your plan",
        done: plan.length > 0,
        href: "/plan",
      },
      {
        label: "Ask EPHS AI a question",
        done: profile.interests.length > 0,
        href: "/chat",
      },
    ],
    [profile, plan, hasTranscript],
  );

  const doneCount = items.filter((i) => i.done).length;
  const complete = doneCount === items.length;

  if (!ready || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <section
      aria-label="Setup checklist"
      className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks aria-hidden className="h-4 w-4 text-ep-red" />
          <h2 className="text-sm font-bold text-ep-charcoal">
            {complete ? "You're all set" : "Finish setting up"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ep-faint">
            {doneCount}/{items.length}
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md p-1 text-ep-faint hover:bg-ep-bg-sunken hover:text-ep-charcoal"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ep-bg-sunken">
        <div
          className="h-full rounded-full bg-ep-success transition-[width] duration-500 ease-ep-out"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      {!complete ? (
        <ul className="mt-3 space-y-1">
          {items
            .filter((i) => !i.done)
            .map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ep-ink transition-colors hover:bg-ep-bg-sunken"
                >
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ep-border"
                  />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight aria-hidden className="h-4 w-4 text-ep-faint" />
                </Link>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ep-muted">
          Every setup step is done. You can dismiss this anytime.
        </p>
      )}

      {doneCount > 0 && !complete ? (
        <p className="mt-2 flex items-center gap-1.5 px-2 text-xs text-ep-muted">
          <Check aria-hidden className={clsx("h-3.5 w-3.5 text-ep-success")} />
          {doneCount} done so far
        </p>
      ) : null}
    </section>
  );
}
