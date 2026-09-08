import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

export { CopyButton } from "./copy-button";

/* -------------------------------- StatCard -------------------------------- */

export function StatCard({
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  icon: Icon,
  emphasis,
  invertDelta,
  href,
  chart,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  /** Percentage change vs the comparison period. */
  delta?: number | null;
  deltaLabel?: string;
  icon?: React.ElementType;
  /** Marks the single most important metric on the screen — uses the accent. */
  emphasis?: boolean;
  /** For metrics where a decrease is good (e.g. cycle time, approval turnaround). */
  invertDelta?: boolean;
  href?: string;
  chart?: React.ReactNode;
  className?: string;
}) {
  const good = delta == null ? null : invertDelta ? delta < 0 : delta > 0;
  const flat = delta != null && Math.abs(delta) < 0.5;
  const DeltaIcon = flat ? Minus : (delta ?? 0) > 0 ? ArrowUpRight : ArrowDownRight;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-eyebrow text-faint">{label}</p>
        {Icon ? (
          <Icon
            className={cn("size-4 shrink-0", emphasis ? "text-accent" : "text-ghost")}
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={cn(
          "text-metric mt-3",
          emphasis ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[12px] font-medium tabular",
              flat ? "text-faint" : good ? "text-positive" : "text-negative",
            )}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {Math.abs(delta).toFixed(delta % 1 === 0 ? 0 : 1)}%
          </span>
        ) : null}
        {sublabel ? <span className="text-[12px] text-faint">{sublabel}</span> : null}
        {delta != null && deltaLabel ? (
          <span className="text-[12px] text-faint">{deltaLabel}</span>
        ) : null}
      </div>
      {chart ? <div className="mt-3">{chart}</div> : null}
    </>
  );

  const classes = cn(
    "rounded-lg border bg-elevated p-4",
    emphasis ? "border-accent-line" : "border-line",
    href && "transition-colors hover:border-line-strong hover:bg-[#181d23]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, "block")}>
        {inner}
      </Link>
    );
  }
  return <div className={classes}>{inner}</div>;
}

/* -------------------------------- ScoreBar -------------------------------- */

export function ScoreBar({
  label,
  value,
  max = 100,
  tone = "neutral",
  showValue = true,
  className,
}: {
  label?: string;
  value: number;
  max?: number;
  tone?: "neutral" | "accent" | "positive" | "warning";
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = {
    neutral: "bg-muted/60",
    accent: "bg-accent",
    positive: "bg-positive",
    warning: "bg-warning",
  }[tone];

  return (
    <div className={cn("min-w-0", className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label ? <span className="text-[12px] text-muted">{label}</span> : <span />}
          {showValue ? (
            <span className="text-[12px] font-medium tabular text-ink">{Math.round(value)}</span>
          ) : null}
        </div>
      ) : null}
      <div className="h-1 overflow-hidden rounded-full bg-raised">
        <div
          className={cn("h-full rounded-full transition-all duration-500", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  hue = 210,
  size = "md",
  className,
}: {
  name: string;
  hue?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    xs: "size-5 text-[9px]",
    sm: "size-6 text-[10px]",
    md: "size-8 text-[11px]",
    lg: "size-11 text-[14px]",
  }[size];

  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-medium uppercase tracking-wide",
        dims,
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 22% 22%)`,
        color: `hsl(${hue} 40% 78%)`,
        border: `1px solid hsl(${hue} 22% 30%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 3,
}: {
  people: { name: string; hue?: number }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} hue={p.hue} size="sm" className="ring-2 ring-elevated" />
      ))}
      {rest > 0 ? (
        <span className="grid size-6 place-items-center rounded-full bg-raised text-[10px] font-medium text-muted ring-2 ring-elevated">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Kbd ----------------------------------- */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1.5 font-sans text-[10px] font-medium text-faint",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* -------------------------------- Timeline -------------------------------- */

export function Timeline({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ol className={cn("relative space-y-0", className)}>{children}</ol>;
}

export function TimelineItem({
  icon: Icon,
  tone = "neutral",
  title,
  meta,
  children,
  last,
}: {
  icon?: React.ElementType;
  tone?: "neutral" | "accent" | "positive" | "negative" | "warning";
  title: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const tones = {
    neutral: "border-line-strong bg-surface text-faint",
    accent: "border-accent-line bg-accent-soft text-accent",
    positive: "border-positive/30 bg-positive-soft text-positive",
    negative: "border-negative/30 bg-negative-soft text-negative",
    warning: "border-warning/30 bg-warning-soft text-warning",
  };

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last ? (
        <span
          className="absolute left-[13px] top-7 bottom-0 w-px bg-line"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border",
          tones[tone],
        )}
      >
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-[13px] leading-snug text-ink">{title}</p>
          {meta ? <span className="text-[11px] text-faint">{meta}</span> : null}
        </div>
        {children ? (
          <div className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{children}</div>
        ) : null}
      </div>
    </li>
  );
}

/* ------------------------------ Definition list ---------------------------- */

export function DefinitionList({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-eyebrow text-faint">{item.label}</dt>
          <dd className="mt-1.5 text-[13px] leading-relaxed text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
