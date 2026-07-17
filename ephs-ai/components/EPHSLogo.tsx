import Link from "next/link";
import clsx from "clsx";

/**
 * EPHS AI wordmark: a red swept "EP" block in the school's varsity style
 * with a condensed "EPHS AI" lockup. Rendered as type so it stays crisp at
 * every size. Swap in an official asset at public/branding when supplied.
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
      <span
        aria-hidden
        className="flex h-8 w-10 -skew-x-12 items-center justify-center rounded-[3px] bg-ep-red shadow-[3px_3px_0_rgba(19,16,19,0.35)]"
      >
        <span className="skew-x-12 font-display text-lg font-bold leading-none text-white">
          EP
        </span>
      </span>
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
            "mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em]",
            onDark ? "text-white/50" : "text-ep-faint",
          )}
        >
          Eden Prairie Eagles
        </span>
      </span>
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
