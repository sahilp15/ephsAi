"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/mappings", label: "Course Mappings" },
  { href: "/admin/access", label: "Admin Access" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/data", label: "Data Audit" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-1 border-b border-ep-border-soft">
      {TABS.map((t) => {
        const active =
          t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-t-md px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "border-b-2 border-ep-red text-ep-charcoal"
                : "text-ep-muted hover:text-ep-charcoal",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
