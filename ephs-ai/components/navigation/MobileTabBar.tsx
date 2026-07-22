"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { MOBILE_MORE, MOBILE_PRIMARY, isNavActive } from "./nav-config";

/**
 * Mobile bottom navigation — adapts the compact tab-bar + "More" sheet model of
 * `@easemize/modern-mobile-menu`. Five targets: four primary destinations and a
 * "More" button that opens the slide-up sheet. Safe-area aware, 44px+ targets,
 * hidden on desktop.
 */
export function MobileTabBar({
  moreOpen,
  onToggleMore,
}: {
  moreOpen: boolean;
  onToggleMore: () => void;
}) {
  const pathname = usePathname();
  const moreActive = MOBILE_MORE.some((i) => isNavActive(pathname, i.href));

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-ep-border bg-ep-card/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {MOBILE_PRIMARY.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-ep-red-dark" : "text-ep-muted",
                )}
              >
                <Icon
                  aria-hidden
                  className={clsx("h-[22px] w-[22px]", active && "text-ep-red")}
                />
                {item.short ?? item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onToggleMore}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={clsx(
              "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              moreActive || moreOpen ? "text-ep-red-dark" : "text-ep-muted",
            )}
          >
            <MoreHorizontal
              aria-hidden
              className={clsx(
                "h-[22px] w-[22px]",
                (moreActive || moreOpen) && "text-ep-red",
              )}
            />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
