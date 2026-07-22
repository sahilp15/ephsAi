"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import clsx from "clsx";
import { APP_NAV, isNavActive } from "@/components/navigation/nav-config";
import { ShellAccount } from "@/components/auth/ShellAccount";

/**
 * Desktop student sidebar — adapts the collapse/expand model and grouped
 * navigation of `@arunjdass/dashboard-sidebar`, rebuilt zero-dependency with
 * EPHS tokens. Expanded shows grouped labels; collapsed shows icon-only with
 * native tooltips. Width is driven by a CSS var so the content column stays in
 * sync. The collapse button is a real <button> with aria-pressed.
 */
export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary"
      className={clsx(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ep-border bg-ep-card transition-[width] duration-panel ease-ep-out lg:flex",
        collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
      )}
    >
      {/* Brand */}
      <div
        className={clsx(
          "flex h-16 items-center border-b border-ep-border-soft",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="EPHS AI home"
          className="flex items-center gap-2.5"
        >
          <Image
            src="/branding/ephs-ai-logo.png"
            alt=""
            width={1080}
            height={1080}
            priority
            className="h-9 w-auto"
          />
          {!collapsed ? (
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-wide text-ep-charcoal">
                EPHS <span className="text-ep-red">AI</span>
              </span>
              <span className="mt-1 font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-ep-faint">
                Eden Prairie High School
              </span>
            </span>
          ) : null}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="scroll-quiet flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {APP_NAV.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ep-faint">
                {group.label}
              </p>
            ) : (
              <div className="mx-3 mb-2 h-px bg-ep-border-soft first:hidden" aria-hidden />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-micro",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-ep-red-soft text-ep-red-dark"
                          : "text-ep-muted hover:bg-ep-bg-sunken hover:text-ep-charcoal",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-ep-red"
                        />
                      ) : null}
                      <Icon
                        aria-hidden
                        className={clsx(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-ep-red" : "text-ep-faint group-hover:text-ep-charcoal",
                        )}
                      />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account + collapse toggle */}
      <div className="space-y-2 border-t border-ep-border-soft p-3">
        <ShellAccount collapsed={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={collapsed}
          className={clsx(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ep-faint transition-colors hover:bg-ep-bg-sunken hover:text-ep-charcoal",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose aria-hidden className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
