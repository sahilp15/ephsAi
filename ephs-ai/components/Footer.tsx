import Link from "next/link";
import { EPHSLogo } from "./EPHSLogo";

const FOOTER_LINKS = [
  { href: "/chat", label: "EPHS Student Helper" },
  { href: "/courses", label: "Course Catalog" },
  { href: "/clubs", label: "Clubs & Activities" },
  { href: "/requirements", label: "Graduation Requirements" },
  { href: "/counselor", label: "Counselor View" },
  { href: "/admin", label: "Data Audit" },
  { href: "/privacy", label: "Privacy Notice" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 bg-ep-coal text-white">
      <div aria-hidden className="h-0.5 w-full bg-ep-red" />
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <EPHSLogo onDark withLink={false} />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              A course-planning tool grounded in the official Eden Prairie High
              School Course Guide 2026-27. Course facts shown here come only
              from that guide; final scheduling and graduation decisions always
              require counselor verification.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Privacy: your plan and profile are stored on your own device.
              Assistant requests send anonymized planning context only, never
              your name or contact information.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-2.5 md:grid-cols-1"
          >
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Eden Prairie Eagles · 2026-27 Course Guide · Not an official EPHS
            publication
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Developed by Sahil Parasharami with Eden Prairie Schools
          </p>
        </div>
      </div>
    </footer>
  );
}
