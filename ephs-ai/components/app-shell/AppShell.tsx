"use client";

import { useCallback, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileTabBar } from "@/components/navigation/MobileTabBar";
import { MoreSheet } from "@/components/navigation/MoreSheet";
import { CommandPalette } from "@/components/command-palette/CommandPalette";

const COLLAPSE_KEY = "ephs-ai:sidebar-collapsed:v1";

/**
 * Student application shell: collapsible desktop sidebar, compact top bar,
 * command palette (⌘/Ctrl-K), and mobile bottom navigation with a "More"
 * sheet. Owns the shared open/collapsed state so the pieces stay in sync.
 * Server-rendered page content is passed through as `children`.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Restore the persisted collapsed preference (post-hydration, no mismatch).
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Global command-palette shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-ep-bg">
      <AppSidebar collapsed={collapsed} onToggle={toggleCollapse} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenPalette={() => setPaletteOpen(true)} />
        <main
          id="main-content"
          className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <MobileTabBar moreOpen={moreOpen} onToggleMore={() => setMoreOpen((v) => !v)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
