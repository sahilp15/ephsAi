"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles } from "lucide-react";

/**
 * Compact top bar for the student app. Its centrepiece is the command-palette
 * launcher (⌘K). On mobile it also carries the brand mark (the sidebar is
 * hidden there); page-level actions render inside each page's own header.
 */
export function AppTopbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ep-border bg-ep-bg/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-ep-bg/70 sm:px-6">
      {/* Mobile brand */}
      <Link href="/dashboard" aria-label="EPHS Student Helper home" className="lg:hidden">
        <Image
          src="/branding/ephs-ai-logo.png"
          alt=""
          width={1080}
          height={1080}
          priority
          className="h-9 w-auto"
        />
      </Link>

      {/* Palette launcher */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="flex h-10 flex-1 items-center gap-2.5 rounded-lg border border-ep-border bg-ep-card px-3 text-left text-sm text-ep-faint transition-colors hover:border-ep-steel sm:max-w-sm"
        aria-label="Search courses, pages, and actions"
      >
        <Search aria-hidden className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search courses & pages…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-ep-border bg-ep-bg px-1.5 py-0.5 font-mono text-[10px] font-medium text-ep-faint sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1 lg:hidden" aria-hidden />

      <Link
        href="/chat"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ep-charcoal px-3.5 text-sm font-semibold text-white transition-colors hover:bg-ep-coal"
      >
        <Sparkles aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">Ask the Helper</span>
        <span className="sm:hidden">Ask</span>
      </Link>
    </header>
  );
}
