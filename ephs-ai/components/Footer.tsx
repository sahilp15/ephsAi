import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ep-border bg-white">
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl text-xs leading-relaxed text-ep-muted">
            <p className="font-semibold text-ep-charcoal">EPHS AI</p>
            <p className="mt-1">
              A course-planning tool grounded in the official Eden Prairie High
              School Course Guide 2026-27. Course facts shown here come only
              from that guide; final scheduling and graduation decisions always
              require counselor verification.
            </p>
            <p className="mt-2">
              Privacy: your plan and profile are stored on your own device.
              Recommendation requests send anonymized planning context only —
              never your name or contact information.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-1 text-xs">
            <Link href="/courses" className="text-ep-muted hover:text-ep-red-dark">
              Course Catalog
            </Link>
            <Link href="/requirements" className="text-ep-muted hover:text-ep-red-dark">
              Graduation Requirements
            </Link>
            <Link href="/counselor" className="text-ep-muted hover:text-ep-red-dark">
              Counselor View
            </Link>
            <Link href="/admin" className="text-ep-muted hover:text-ep-red-dark">
              Data Audit
            </Link>
            <Link href="/privacy" className="text-ep-muted hover:text-ep-red-dark">
              Privacy Notice
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
