import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { EPHSLogo } from "@/components/EPHSLogo";

/**
 * Staff shell for the counselor and administrator areas. Deliberately distinct
 * from the student app: a slim command bar signalling elevated access, no
 * student sidebar or marketing footer. Role checks live in each page/layout
 * (`requireAdmin`, counselor guards) — this is chrome only.
 */
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ep-bg">
      <header className="sticky top-0 z-30 border-b border-ep-border bg-ep-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <EPHSLogo />
            <span className="hidden items-center gap-1.5 rounded-full border border-ep-border bg-ep-bg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ep-muted sm:inline-flex">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-ep-red" />
              Staff area
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="font-medium text-ep-muted hover:text-ep-charcoal"
            >
              Student view
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ep-border bg-ep-card px-3 py-1.5 font-semibold text-ep-charcoal hover:bg-ep-bg-sunken"
              >
                <LogOut aria-hidden className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
