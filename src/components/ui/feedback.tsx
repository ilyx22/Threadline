import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

/* ------------------------------- Skeleton ------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-md bg-raised/70", className)}
      {...props}
    />
  );
}

/** Skeleton shaped like a text block, so loading states match final layout. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? "62%" : `${88 - i * 6}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-line bg-elevated p-5", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3.5 h-7 w-32" />
      <Skeleton className="mt-3 h-2.5 w-full" />
    </div>
  );
}

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-line rounded-lg border border-line bg-elevated", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-[45%]" />
            <Skeleton className="h-2.5 w-[28%]" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Empty state ------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: {
  icon?: React.ElementType;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 grid size-11 place-items-center rounded-lg border border-line bg-surface">
          <Icon className="size-5 text-faint" aria-hidden />
        </div>
      ) : null}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ Error state ------------------------------ */

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-negative/25 bg-negative-soft px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-11 place-items-center rounded-lg border border-negative/25 bg-elevated">
        <AlertTriangle className="size-5 text-negative" aria-hidden />
      </div>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-5" variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Inline notice. Used for honest product statements — e.g. an integration that
 * genuinely cannot connect yet, or output produced in demo mode.
 */
export function Notice({
  tone = "info",
  title,
  children,
  icon: Icon,
  action,
  className,
}: {
  tone?: "info" | "warning" | "positive" | "neutral";
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-info/25 bg-info-soft",
    warning: "border-warning/25 bg-warning-soft",
    positive: "border-positive/25 bg-positive-soft",
    neutral: "border-line bg-surface",
  };
  const iconTones = {
    info: "text-info",
    warning: "text-warning",
    positive: "text-positive",
    neutral: "text-faint",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3", tones[tone], className)}>
      <div className="flex items-start gap-3">
        {Icon ? <Icon className={cn("mt-0.5 size-4 shrink-0", iconTones[tone])} aria-hidden /> : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="text-[13px] font-medium text-ink">{title}</p> : null}
          {children ? (
            <div className={cn("text-[12.5px] leading-relaxed text-muted", title && "mt-1")}>
              {children}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
