"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { EPHSLogo } from "@/components/EPHSLogo";

const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/pathways", label: "Pathways" },
  { href: "/clubs", label: "Clubs" },
  { href: "/requirements", label: "Requirements" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ep-border/70 bg-ep-bg/85 backdrop-blur supports-[backdrop-filter]:bg-ep-bg/70">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <EPHSLogo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-micro",
                  active
                    ? "text-ep-charcoal"
                    : "text-ep-muted hover:text-ep-charcoal",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="mx-2 h-5 w-px bg-ep-border" aria-hidden />
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ep-red-dark transition-colors hover:bg-ep-red-soft"
          >
            <Sparkles aria-hidden className="h-4 w-4" />
            Ask EPHS AI
          </Link>
          <Link
            href="/login/student"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-ep-charcoal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ep-coal"
          >
            Sign in
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-ep-charcoal md:hidden"
          aria-expanded={open}
          aria-controls="public-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="public-mobile-nav"
          aria-label="Primary"
          className="animate-fade-in border-t border-ep-border/70 bg-ep-bg px-4 py-3 md:hidden"
        >
          {[...LINKS, { href: "/chat", label: "Ask EPHS AI" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ep-ink hover:bg-ep-bg-sunken"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login/student"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-ep-charcoal px-4 py-2.5 text-sm font-semibold text-white"
          >
            Student sign in
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
