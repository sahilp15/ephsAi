import Link from "next/link";
import { Logo } from "./Logo";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
      >
        <Link href="/" aria-label={`${brand.name} home`} className="shrink-0">
          <Logo size={32} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:text-scarlet"
          >
            About
          </Link>
          <Link
            href="/feedback"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:text-scarlet"
          >
            Feedback
          </Link>
          <Link
            href="/chat"
            className="rounded-full bg-scarlet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-scarlet/90"
          >
            Ask {brand.name}
          </Link>
        </div>
      </nav>
    </header>
  );
}
