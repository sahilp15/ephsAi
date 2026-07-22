"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Compass,
  CornerDownLeft,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Search,
  Sparkles,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { useStudent } from "@/lib/client/student-context";
import { normalizeText } from "@/lib/search/fuzzy";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: "Go to" | "Actions" | "Courses";
  run: () => void;
  keywords?: string;
}

const NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon; kw: string }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, kw: "home overview" },
  { href: "/courses", label: "Courses", icon: BookOpen, kw: "catalog classes" },
  { href: "/plan", label: "Four-Year Plan", icon: CalendarRange, kw: "planner schedule" },
  { href: "/requirements", label: "Requirements", icon: GraduationCap, kw: "graduation credits" },
  { href: "/pathways", label: "Pathways", icon: Compass, kw: "capstone programs" },
  { href: "/clubs", label: "Clubs", icon: Users, kw: "activities" },
  { href: "/transcript", label: "Transcript", icon: LibraryBig, kw: "history import" },
  { href: "/profile", label: "Profile", icon: UserRound, kw: "settings account" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { catalogList } = useStudent();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = NAV_ITEMS.map((n) => ({
      id: `nav:${n.href}`,
      label: n.label,
      icon: n.icon,
      group: "Go to",
      keywords: n.kw,
      run: () => go(n.href),
    }));
    const actions: Command[] = [
      {
        id: "act:ask",
        label: "Ask EPHS AI a question",
        hint: "Grounded in the Course Guide",
        icon: Sparkles,
        group: "Actions",
        keywords: "chat assistant help",
        run: () => go("/chat"),
      },
      {
        id: "act:plan",
        label: "Open the four-year planner",
        icon: CalendarRange,
        group: "Actions",
        keywords: "build schedule",
        run: () => go("/plan"),
      },
      {
        id: "act:transcript",
        label: "Upload a transcript",
        icon: Upload,
        group: "Actions",
        keywords: "import history pdf",
        run: () => go("/transcript"),
      },
      {
        id: "act:profile",
        label: "Open profile & onboarding",
        icon: UserRound,
        group: "Actions",
        keywords: "settings interests",
        run: () => go("/profile"),
      },
    ];
    return [...actions, ...nav];
  }, [go]);

  const q = normalizeText(query);

  const results = useMemo<Command[]>(() => {
    if (!q) return commands;
    const staticMatches = commands.filter((c) =>
      normalizeText(`${c.label} ${c.keywords ?? ""}`).includes(q),
    );
    const courseMatches: Command[] = catalogList
      .filter((c) => normalizeText(`${c.title} ${c.department}`).includes(q))
      .slice(0, 8)
      .map((c) => ({
        id: `course:${c.id}`,
        label: c.title,
        hint: c.department,
        icon: BookOpen,
        group: "Courses" as const,
        run: () => go(`/courses/${c.id}`),
      }));
    return [...staticMatches, ...courseMatches];
  }, [q, commands, catalogList, go]);

  // Reset the highlight whenever the result set changes.
  useEffect(() => setActive(0), [q]);

  // Focus management: capture the trigger, focus the input, restore on close.
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
    restoreRef.current?.focus?.();
  }, [open]);

  // Keep the active row scrolled into view.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-ep-coal/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="relative z-10 w-full max-w-xl origin-top animate-scale-in overflow-hidden rounded-2xl border border-ep-border bg-ep-card shadow-panel"
      >
        <div className="flex items-center gap-3 border-b border-ep-border-soft px-4">
          <Search aria-hidden className="h-5 w-5 shrink-0 text-ep-faint" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-listbox"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search courses, pages, and actions…"
            className="h-14 flex-1 bg-transparent text-[15px] text-ep-charcoal outline-none placeholder:text-ep-faint"
            data-focus-ring="custom"
          />
          <kbd className="hidden rounded border border-ep-border bg-ep-bg px-1.5 py-0.5 font-mono text-[10px] text-ep-faint sm:inline">
            ESC
          </kbd>
        </div>

        <ul
          ref={listRef}
          id="cmd-listbox"
          role="listbox"
          aria-label="Results"
          className="scroll-quiet max-h-[52vh] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-ep-muted">
              No matches for “{query}”. Try a course name or a page.
            </li>
          ) : (
            results.map((c, i) => {
              const showGroup = c.group !== lastGroup;
              lastGroup = c.group;
              const Icon = c.icon;
              const isActive = i === active;
              return (
                <li key={c.id} role="presentation">
                  {showGroup ? (
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ep-faint">
                      {c.group}
                    </p>
                  ) : null}
                  <div
                    id={`cmd-${c.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => c.run()}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                      isActive
                        ? "bg-ep-red-soft text-ep-red-dark"
                        : "text-ep-ink",
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={clsx(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-ep-red" : "text-ep-faint",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {c.label}
                    </span>
                    {c.hint ? (
                      <span className="shrink-0 truncate text-xs text-ep-faint">
                        {c.hint}
                      </span>
                    ) : null}
                    {isActive ? (
                      <CornerDownLeft aria-hidden className="h-3.5 w-3.5 shrink-0 text-ep-red" />
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-ep-border-soft px-4 py-2 text-[11px] text-ep-faint">
          <span className="flex items-center gap-1.5">
            <ArrowRight aria-hidden className="h-3 w-3" /> Real EPHS courses &
            pages
          </span>
          <span className="hidden sm:inline">↑↓ to navigate · ↵ to open</span>
        </div>
      </div>
    </div>
  );
}
