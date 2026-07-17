import type { ReactNode } from "react";
import clsx from "clsx";
import { AlertTriangle, BookOpen, Info } from "lucide-react";

/** Shared EPHS design-system primitives (server-safe). */

/** Standard page heading: kicker, condensed display title, lede. */
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
      {kicker ? <p className="kicker text-ep-red">{kicker}</p> : null}
      <h1 className="mt-1 text-4xl font-bold leading-none text-ep-charcoal sm:text-5xl">
        {title}
      </h1>
      {lede ? (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ep-muted">
          {lede}
        </p>
      ) : null}
      {children}
    </div>
  );
}

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

const BADGE_STYLES: Record<string, string> = {
  AP: "bg-ep-coal text-white",
  Honors: "bg-ep-red text-white",
  Capstone: "bg-ep-red-soft text-ep-red-dark border border-ep-red/30",
  CIS: "bg-ep-bg text-ep-ink border border-ep-border",
  Skinny: "bg-ep-bg text-ep-ink border border-ep-border",
  New: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  "College Credit": "bg-ep-bg text-ep-ink border border-ep-border",
};

export function CourseBadge({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex -skew-x-12 items-center rounded-[2px] px-1.5 py-0.5",
        BADGE_STYLES[label] ?? "bg-ep-bg text-ep-ink border border-ep-border",
      )}
    >
      <span className="skew-x-12 font-mono text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </span>
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
    warning: "border-l-amber-500 bg-amber-50 text-amber-900",
    info: "border-l-ep-charcoal bg-white text-ep-ink shadow-card",
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
        {title ? (
          <p className="font-display text-base font-bold uppercase tracking-wide">
            {title}
          </p>
        ) : null}
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
        "rounded-r-lg border-l-4 border-l-ep-red bg-white p-3.5 text-sm text-ep-muted shadow-card",
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

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ep-border bg-white p-10 text-center">
      <span className="wing-stripes justify-center opacity-40" aria-hidden>
        <i /><i /><i />
      </span>
      <p className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-ep-charcoal">
        {title}
      </p>
      {children ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-ep-muted">{children}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-ep-border-soft bg-white p-4 shadow-card">
      <span
        aria-hidden
        className="absolute -right-1 top-3 h-2.5 w-7 skew-x-[-28deg] bg-ep-red/85"
      />
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ep-faint">
        {label}
      </p>
      <p className="mt-1 font-display text-4xl font-bold leading-none text-ep-charcoal">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-ep-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Neutral progress indicator. Deliberately labeled as "exploration" counts -
 * never as pathway/graduation completion, which the guide does not define.
 */
export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-ep-muted">
        <span>{label}</span>
        <span className="font-mono text-[11px]">
          {value} of {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 overflow-hidden rounded-sm bg-ep-border-soft"
      >
        <div
          className="h-full rounded-sm bg-gradient-to-r from-ep-red-dark to-ep-red transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
