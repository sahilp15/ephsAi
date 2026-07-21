import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

/**
 * EPHS AI logo lockup.
 *
 * Pairs the official Eden Prairie Schools logo (supplied at
 * `public/branding/ephs-ai-logo.png`) with the "EPHS AI" wordmark. The image
 * asset is used exactly as provided — not cropped, stretched, recolored, or
 * redrawn — and `next/image` preserves its native square aspect ratio. The
 * mark reads clearly on both light and dark backgrounds.
 */
export function EPHSLogo({
  withLink = true,
  onDark = false,
}: {
  withLink?: boolean;
  onDark?: boolean;
}) {
  const mark = (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/branding/ephs-ai-logo.png"
        alt="Eden Prairie Schools logo"
        width={1080}
        height={1080}
        priority
        sizes="(max-width: 640px) 40px, 44px"
        className="h-10 w-auto sm:h-11"
      />
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "font-display text-xl font-bold uppercase tracking-wide",
            onDark ? "text-white" : "text-ep-charcoal",
          )}
        >
          EPHS <span className="text-ep-red">AI</span>
        </span>
        <span
          className={clsx(
            "mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.18em]",
            onDark ? "text-white/50" : "text-ep-faint",
          )}
        >
          Eden Prairie High School
        </span>
      </span>
    </span>
  );
  if (!withLink) return mark;
  return (
    <Link
      href="/"
      aria-label="EPHS AI home"
      className="inline-flex rounded focus-visible:outline-ep-red"
    >
      {mark}
    </Link>
  );
}
