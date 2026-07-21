import Link from "next/link";
import { EPHSLogo } from "./EPHSLogo";

const FOOTER_LINKS = [
  { href: "/chat", label: "EPHS AI Assistant" },
  { href: "/courses", label: "Course Catalog" },
  { href: "/clubs", label: "Clubs & Activities" },
  { href: "/requirements", label: "Graduation Requirements" },
  { href: "/counselor", label: "Counselor View" },
  { href: "/admin", label: "Data Audit" },
  { href: "/privacy", label: "Privacy Notice" },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 bg-ep-coal text-white">
      <div aria-hidden className="h-1 w-full bg-ep-red" />
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <EPHSLogo onDark withLink={false} />
            <span className="wing-stripes mt-4" aria-hidden>
              <i /><i /><i />
            </span>
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              A course-planning tool grounded in the official Eden Prairie High
              School Course Guide 2026-27. Course facts shown here come only
              from that guide; final scheduling and graduation decisions always
              require counselor verification.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              Privacy: your plan and profile are stored on your own device.
              Assistant requests send anonymized planning context only, never
              your name or contact information.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-2 md:grid-cols-1"
          >
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-display text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-ep-red"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Eden Prairie Eagles · 2026-27 Course Guide · Not an official EPHS
            publication
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            Developed by Sahil Parasharami with Eden Prairie Schools
          </p>
        </div>
      </div>
    </footer>
  );
}
