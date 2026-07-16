import Link from "next/link";

/**
 * EPHS AI mark.
 *
 * LOGO REPLACEMENT POINT — when the official EPHS AI logo asset is supplied:
 *   1. Place the exact file at public/branding/ephs-ai-logo.png (or .svg).
 *   2. Replace the text mark below with:
 *        <Image src="/branding/ephs-ai-logo.png" alt="EPHS AI" height={32} width={...} />
 *      preserving the native aspect ratio.
 *   3. Do not redraw, recolor, stretch, or substitute a generated logo.
 * Until then this accessible text-only fallback is used (per branding policy
 * in the course-guide dataset).
 */
export function EPHSLogo({ withLink = true }: { withLink?: boolean }) {
  const mark = (
    <span className="inline-flex items-baseline gap-1.5 font-bold tracking-tight">
      <span className="rounded bg-ep-red px-1.5 py-0.5 text-sm leading-none text-white">
        EPHS
      </span>
      <span className="text-lg leading-none text-ep-charcoal">AI</span>
    </span>
  );
  if (!withLink) return mark;
  return (
    <Link
      href="/"
      aria-label="EPHS AI home"
      className="rounded focus-visible:outline-ep-red"
    >
      {mark}
    </Link>
  );
}
