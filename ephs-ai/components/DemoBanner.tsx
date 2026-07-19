import Link from "next/link";
import { Eye } from "lucide-react";

/**
 * Fixed notice shown on every `/demo` page. Makes it unmistakable that the
 * screen is a no-login preview of the student experience, populated with
 * sample data, and not a real signed-in session.
 */
export function DemoBanner() {
  return (
    <div className="flex flex-col gap-2 rounded-r-lg border-l-4 border-l-ep-red bg-ep-red-soft p-3.5 text-sm text-ep-red-dark sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Eye aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <span className="font-display font-bold uppercase tracking-wide">
            Preview mode
          </span>{" "}
          — this is a demo of the student experience with sample data. No
          sign-in required and nothing is saved.
        </span>
      </p>
      <div className="flex flex-shrink-0 gap-3 pl-6 sm:pl-0">
        <Link
          href="/demo/onboarding"
          className="font-semibold underline-offset-4 hover:underline"
        >
          Onboarding
        </Link>
        <Link
          href="/demo/dashboard"
          className="font-semibold underline-offset-4 hover:underline"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
