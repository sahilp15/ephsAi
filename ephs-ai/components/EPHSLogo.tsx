import Link from "next/link";
import Image from "next/image";

/**
 * EPHS AI logo lockup.
 *
 * Renders the official Eden Prairie Schools logo supplied at
 * `public/branding/ephs-ai-logo.png`. The asset is used exactly as provided:
 * it is not cropped, stretched, recolored, or redrawn. Because the source is a
 * transparent square PNG, `next/image` keeps its native aspect ratio (a fixed
 * display height with `w-auto`), and the mark reads clearly on both light and
 * dark backgrounds.
 */
export function EPHSLogo({
  withLink = true,
}: {
  withLink?: boolean;
  /** Accepted for call-site compatibility; the raster asset renders identically on any background. */
  onDark?: boolean;
}) {
  const mark = (
    <Image
      src="/branding/ephs-ai-logo.png"
      alt="Eden Prairie Schools logo"
      width={1080}
      height={1080}
      priority
      sizes="(max-width: 640px) 44px, 48px"
      className="h-11 w-auto sm:h-12"
    />
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
