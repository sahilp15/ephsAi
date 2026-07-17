"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Menu, X } from "lucide-react";
import clsx from "clsx";
import { EPHSLogo } from "./EPHSLogo";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/plan", label: "Four-Year Plan" },
  { href: "/requirements", label: "Requirements" },
  { href: "/pathways", label: "Pathways" },
] as const;

export function EPHSHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const chatActive = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ep-coal text-white">
      {/* red top rule, like the guide's cover band */}
      <div aria-hidden className="h-1 w-full bg-ep-red" />
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <EPHSLogo onDark />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative rounded px-3 py-2 font-display text-[15px] font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "text-white after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:skew-x-[-28deg] after:bg-ep-red"
                    : "text-white/60 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/chat"
            aria-current={chatActive ? "page" : undefined}
            className={clsx(
              "ml-3 inline-flex -skew-x-12 items-center gap-2 rounded-[3px] px-4 py-2 transition-colors",
              chatActive
                ? "bg-white text-ep-coal"
                : "bg-ep-red text-white hover:bg-ep-red-dark",
            )}
          >
            <span className="flex skew-x-12 items-center gap-1.5 font-display text-[15px] font-bold uppercase tracking-wider">
              <MessageCircle aria-hidden className="h-4 w-4" />
              Ask EPHS AI
            </span>
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-md p-2 text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X aria-hidden className="h-5 w-5" />
          ) : (
            <Menu aria-hidden className="h-5 w-5" />
          )}
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-white/10 bg-ep-coal px-4 py-3 lg:hidden"
        >
          {[...NAV, { href: "/chat", label: "Ask EPHS AI" } as const].map(
            (item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block rounded-md px-3 py-2.5 font-display text-base font-semibold uppercase tracking-wider",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>
      ) : null}
    </header>
  );
}
