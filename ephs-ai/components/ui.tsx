import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, BookOpen, Info, type LucideIcon } from "lucide-react";

/**
 * Shared EPHS Student Helper design-system primitives (server-safe).
 *
 * "Academic editorial": calm neutrals, moderate radii, soft elevation, red
 * reserved for primary actions and brand accents. Sentence-case headings;
 * condensed display type is opt-in, never forced.
 */

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-micro ease-ep-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ep-red focus-visible:ring-offset-2 focus-visible:ring-offset-ep-bg disabled:cursor-not-allowed disabled:opacity-50";

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ep-red text-white hover:bg-ep-red-dark shadow-xs",
  secondary:
    "border border-ep-border bg-ep-card text-ep-charcoal hover:bg-ep-bg-sunken",
  ghost: "text-ep-ink hover:bg-ep-bg-sunken",
  danger: "bg-ep-red-deep text-white hover:bg-ep-red-dark",
};

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return clsx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className);
}

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;
  return (
    <Component className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  as: Component = "div",
  className,
  interactive = false,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  interactive?: boolean;
  children: ReactNode;
} & ComponentPropsWithoutRef<"div">) {
  return (
    <Component
      className={clsx(
        "rounded-xl border border-ep-border-soft bg-ep-card shadow-card",
        interactive &&
          "transition-all duration-micro ease-ep-out hover:-translate-y-0.5 hover:border-ep-border hover:shadow-card-hover",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

/* ----------------------------------------------------------- Section header */

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-4", className)}>
      <h2 className="text-lg font-bold tracking-tight text-ep-charcoal">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------- PageHeader */

/** Standard page heading: optional kicker, sentence-case title, lede. */
export function PageHeader({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ep-charcoal sm:text-4xl">
        {title}
      </h1>
      {lede ? (
        <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-ep-muted">
          {lede}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- Citation */

export function SourceCitation({
  pages,
  className,
}: {
  pages: number[];
  className?: string;
}) {
  if (pages.length === 0) return null;
  const label = pages.length === 1 ? "page" : "pages";
  return (
    <p
      className={clsx(
        "flex items-center gap-1.5 font-mono text-[11px] text-ep-faint",
        className,
      )}
    >
      <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-ep-red" />
      <span>
        Source: EPHS Course Guide 2026-27, {label} {pages.join(", ")}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------- Badges */

const BADGE_STYLES: Record<string, string> = {
  AP: "bg-ep-charcoal text-white",
  Honors: "bg-ep-red text-white",
  CIS: "border border-ep-border bg-ep-bg text-ep-ink",
  Capstone: "border border-ep-red/25 bg-ep-red-soft text-ep-red-dark",
  Skinny: "border border-ep-border bg-ep-bg text-ep-ink",
  New: "border border-ep-success/25 bg-ep-success-soft text-ep-success",
  "College Credit": "border border-ep-info/25 bg-ep-info-soft text-ep-info",
};

export function CourseBadge({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
        BADGE_STYLES[label] ?? "border border-ep-border bg-ep-bg text-ep-ink",
      )}
    >
      {label}
    </span>
  );
}

export function courseBadgeLabels(
  flags: {
    ap: boolean;
    honors: boolean;
    capstone: boolean;
    skinny: boolean;
    cis: boolean;
    new_course: boolean;
  },
  collegeCredit?: boolean,
): string[] {
  const labels: string[] = [];
  if (flags.ap) labels.push("AP");
  if (flags.honors) labels.push("Honors");
  if (flags.cis) labels.push("CIS");
  if (flags.capstone) labels.push("Capstone");
  if (flags.skinny) labels.push("Skinny");
  if (flags.new_course) labels.push("New");
  if (collegeCredit) labels.push("College Credit");
  return labels;
}

type ChipTone = "neutral" | "red" | "success" | "warn" | "info";
const CHIP_TONE: Record<ChipTone, string> = {
  neutral: "border-ep-border bg-ep-card text-ep-ink",
  red: "border-ep-red/25 bg-ep-red-soft text-ep-red-dark",
  success: "border-ep-success/25 bg-ep-success-soft text-ep-success",
  warn: "border-ep-warn/25 bg-ep-warn-soft text-ep-warn",
  info: "border-ep-info/25 bg-ep-info-soft text-ep-info",
};

/** Small pill for metadata and active-filter chips. */
export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        CHIP_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Banners */

export function WarningBanner({
  severity = "warning",
  title,
  children,
}: {
  severity?: "error" | "warning" | "info";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    error: "border-l-ep-red bg-ep-red-soft text-ep-red-dark",
    warning: "border-l-ep-warn bg-ep-warn-soft text-ep-warn",
    info: "border-l-ep-info bg-ep-info-soft text-ep-ink",
  }[severity];
  const Icon = severity === "info" ? Info : AlertTriangle;
  return (
    <div
      role={severity === "error" ? "alert" : "status"}
      className={clsx(
        "flex gap-2.5 rounded-r-lg border-l-4 p-3.5 text-sm",
        styles,
      )}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function CounselorVerificationNotice({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-r-lg border-l-4 border-l-ep-red bg-ep-card p-3.5 text-sm text-ep-muted shadow-xs",
        className,
      )}
    >
      <p className="flex items-start gap-2">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ep-red" />
        <span>
          This tool uses the 2026-27 EPHS Course Guide. Some graduation and
          scheduling decisions require counselor verification.
        </span>
      </p>
    </div>
  );
}

/* ----------------------------------------------------- Empty / error states */

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-dashed border-ep-border bg-ep-card px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span
          aria-hidden
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ep-bg-sunken text-ep-muted"
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className="text-base font-semibold text-ep-charcoal">{title}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ep-muted">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-ep-red/20 bg-ep-red-soft px-6 py-10 text-center"
    >
      <span
        aria-hidden
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ep-card text-ep-red"
      >
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-ep-red-dark">{title}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ep-red-dark/80">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------------- Skeletons */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "relative block overflow-hidden rounded-md bg-ep-bg-sunken",
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-[shimmer_1.4s_infinite]",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------- Stats */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-ep-border-soft bg-ep-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ep-faint">
          {label}
        </p>
        {Icon ? <Icon aria-hidden className="h-4 w-4 text-ep-faint" /> : null}
      </div>
      <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-ep-charcoal">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-ep-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Neutral progress indicator. Deliberately labeled as "exploration"/credit
 * counts — never as pathway/graduation completion, which the guide doesn't
 * define. Accepts a tone so callers can signal satisfied vs. in-progress.
 */
export function ProgressBar({
  value,
  max,
  label,
  tone = "red",
  showCount = true,
}: {
  value: number;
  max: number;
  label?: string;
  tone?: "red" | "success" | "neutral";
  showCount?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar = {
    red: "bg-ep-red",
    success: "bg-ep-success",
    neutral: "bg-ep-charcoal",
  }[tone];
  return (
    <div>
      {label || showCount ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-ep-muted">
          {label ? <span>{label}</span> : <span />}
          {showCount ? (
            <span className="font-mono text-[11px]">
              {value} of {max}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Progress"}
        className="h-2 overflow-hidden rounded-full bg-ep-bg-sunken"
      >
        <div
          className={clsx("h-full rounded-full transition-[width] duration-500 ease-ep-out", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
