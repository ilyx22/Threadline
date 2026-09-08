import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone =
  | "neutral"
  | "accent"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "purple"
  | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-raised text-muted border-line-strong",
  accent: "bg-accent-soft text-accent border-accent-line",
  positive: "bg-positive-soft text-positive border-positive/25",
  negative: "bg-negative-soft text-negative border-negative/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  info: "bg-info-soft text-info border-info/25",
  purple: "bg-[rgba(157,127,196,0.14)] text-[#9d7fc4] border-[rgba(157,127,196,0.25)]",
  outline: "bg-transparent text-faint border-line",
};

export function Badge({
  className,
  tone = "neutral",
  icon: Icon,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  icon?: React.ElementType;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden /> : null}
      {Icon ? <Icon className="size-3" aria-hidden /> : null}
      {children}
    </span>
  );
}

/** Square-ish label for metadata (platform, format). Lower emphasis than Badge. */
export function Pill({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-faint whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Priority indicator — colour only for high/urgent so the board stays calm. */
export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    urgent: { tone: "negative", label: "Urgent" },
    high: { tone: "warning", label: "High" },
    medium: { tone: "outline", label: "Medium" },
    low: { tone: "outline", label: "Low" },
  };
  const meta = map[priority] ?? map.medium;
  return (
    <Badge tone={meta.tone} dot={priority === "urgent" || priority === "high"}>
      {meta.label}
    </Badge>
  );
}
