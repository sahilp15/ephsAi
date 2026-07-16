"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { EPHSLogo } from "./EPHSLogo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/plan", label: "Four-Year Plan" },
  { href: "/requirements", label: "Requirements" },
  { href: "/pathways", label: "Pathways" },
  { href: "/recommend", label: "AI Advisor" },
] as const;

export function EPHSHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ep-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <EPHSLogo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-ep-red-soft text-ep-red-dark"
                    : "text-ep-muted hover:bg-ep-bg hover:text-ep-charcoal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="rounded-md p-2 text-ep-charcoal md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-ep-border bg-white px-4 py-2 md:hidden"
        >
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-ep-red-soft text-ep-red-dark"
                    : "text-ep-muted hover:bg-ep-bg hover:text-ep-charcoal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
