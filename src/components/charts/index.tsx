"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { compactNumber } from "@/lib/utils/format";

/**
 * In-house SVG charts.
 *
 * Built rather than imported so the visual system stays consistent and restrained:
 * no chart junk, no default library palette, no gradients-as-decoration. Every
 * chart is responsive via `viewBox`, uses theme tokens, degrades to an explicit
 * empty state, and carries an accessible summary — a picture of data is useless
 * to a screen reader without one.
 *
 * Accent gold appears in exactly one place per screen; charts default to a
 * neutral ink stroke and take the accent only when explicitly asked.
 */

export type SeriesPoint = { label: string; value: number; secondary?: number };

/**
 * How to render a value.
 *
 * A token rather than a formatter function: charts are rendered from Server
 * Components, and a function prop cannot cross that boundary.
 */
export type ValueFormat = "compact" | "number" | "percent" | "leads" | "seconds";

function formatValue(value: number, format: ValueFormat = "compact"): string {
  switch (format) {
    case "number":
      return Math.round(value).toLocaleString("en-GB");
    case "percent":
      return `${Math.round(value * 10) / 10}%`;
    case "leads":
      return `${Math.round(value)} ${Math.round(value) === 1 ? "lead" : "leads"}`;
    case "seconds":
      return `${Math.round(value)}s`;
    default:
      return compactNumber(value);
  }
}

const PADDING = { top: 8, right: 8, bottom: 22, left: 8 };

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

function EmptyChart({ height, message }: { height: number; message: string }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-md border border-dashed border-line text-[12px] text-faint"
    >
      {message}
    </div>
  );
}

/* -------------------------------- AreaTrend -------------------------------- */

export function AreaTrend({
  data,
  height = 180,
  tone = "neutral",
  showAxis = true,
  format = "compact",
  emptyMessage = "No data for this period yet",
  ariaLabel,
  className,
}: {
  data: SeriesPoint[];
  height?: number;
  tone?: "neutral" | "accent" | "positive";
  showAxis?: boolean;
  format?: ValueFormat;
  emptyMessage?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  // Every hook must run before any early return, or hook order changes between
  // a chart with data and one without.
  const gradientId = React.useId();

  if (data.length < 2 || data.every((d) => d.value === 0)) {
    return <EmptyChart height={height} message={emptyMessage} />;
  }

  const width = 600;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - (showAxis ? PADDING.bottom : PADDING.top);

  const stroke =
    tone === "accent" ? "var(--color-accent)" : tone === "positive" ? "var(--color-positive)" : "var(--color-muted)";

  const points = data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * innerW;
    const y = PADDING.top + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `${line} L${points[points.length - 1]!.x.toFixed(2)},${(PADDING.top + innerH).toFixed(
    2,
  )} L${points[0]!.x.toFixed(2)},${(PADDING.top + innerH).toFixed(2)} Z`;

  const active = hover != null ? points[hover] : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={
          ariaLabel ??
          `Trend from ${data[0]?.label} to ${data[data.length - 1]?.label}, peak ${formatValue(max, format)}`
        }
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Reference lines, quiet enough to read past */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line
            key={r}
            x1={PADDING.left}
            x2={width - PADDING.right}
            y1={PADDING.top + innerH - r * innerH}
            y2={PADDING.top + innerH - r * innerH}
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {active ? (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={PADDING.top}
              y2={PADDING.top + innerH}
              stroke="var(--color-line-strong)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r="3.5" fill="var(--color-base)" stroke={stroke} strokeWidth="2" />
          </>
        ) : null}

        {/* Hit areas */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - innerW / (data.length - 1) / 2}
            y={0}
            width={innerW / (data.length - 1)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {showAxis ? (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-ghost">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      ) : null}

      {active ? (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line-strong bg-elevated px-2 py-1 text-[11px] shadow-lg"
          style={{ left: `${(active.x / width) * 100}%` }}
        >
          <span className="text-ghost">{active.label}</span>{" "}
          <span className="font-medium tabular text-ink">{formatValue(active.value, format)}</span>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------- Sparkline -------------------------------- */

export function Sparkline({
  values,
  height = 28,
  tone = "neutral",
  className,
  ariaLabel,
}: {
  values: number[];
  height?: number;
  tone?: "neutral" | "accent" | "positive" | "negative";
  className?: string;
  ariaLabel?: string;
}) {
  if (values.length < 2) return null;

  const width = 120;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stroke = {
    neutral: "var(--color-muted)",
    accent: "var(--color-accent)",
    positive: "var(--color-positive)",
    negative: "var(--color-negative)",
  }[tone];

  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? `Sparkline, ${values.length} points`}
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* -------------------------------- BarSeries -------------------------------- */

export function BarSeries({
  data,
  height = 180,
  tone = "neutral",
  format = "compact",
  emptyMessage = "Nothing to compare yet",
  highlightIndex,
  className,
}: {
  data: SeriesPoint[];
  height?: number;
  tone?: "neutral" | "accent";
  format?: ValueFormat;
  emptyMessage?: string;
  highlightIndex?: number;
  className?: string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <EmptyChart height={height} message={emptyMessage} />;
  }

  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("flex items-end gap-1.5", className)} style={{ height }}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const isHighlight = highlightIndex === i || (tone === "accent" && i === 0);
        return (
          <div key={`${d.label}-${i}`} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-[3px] transition-all duration-500",
                  isHighlight ? "bg-accent" : "bg-raised group-hover:bg-line-strong",
                )}
                style={{ height: `${Math.max(pct, 1.5)}%` }}
              />
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tabular text-faint opacity-0 transition-opacity group-hover:opacity-100">
                {formatValue(d.value, format)}
              </span>
            </div>
            <span className="w-full truncate text-center text-[10px] text-ghost" title={d.label}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ HorizontalRank ----------------------------- */

export function HorizontalRank({
  data,
  format = "compact",
  emptyMessage = "No breakdown available yet",
  max: maxOverride,
  className,
  limit,
}: {
  data: (SeriesPoint & { meta?: string })[];
  format?: ValueFormat;
  emptyMessage?: string;
  max?: number;
  className?: string;
  limit?: number;
}) {
  const rows = limit ? data.slice(0, limit) : data;

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12px] text-faint">
        {emptyMessage}
      </p>
    );
  }

  const max = maxOverride ?? Math.max(...rows.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-2.5", className)}>
      {rows.map((row, i) => (
        <div key={`${row.label}-${i}`} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[12.5px] text-ink" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 text-[12px] tabular text-muted">
              {formatValue(row.value, format)}
              {row.meta ? <span className="ml-1.5 text-ghost">{row.meta}</span> : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                i === 0 ? "bg-accent" : "bg-muted/45",
              )}
              style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- DonutSplit ------------------------------- */

const DONUT_COLORS = [
  "var(--color-accent)",
  "var(--color-info)",
  "var(--color-positive)",
  "var(--color-stage-scheduled)",
  "var(--color-warning)",
  "var(--color-muted)",
];

export function DonutSplit({
  data,
  size = 132,
  thickness = 14,
  centerLabel,
  centerValue,
  emptyMessage = "No data yet",
  className,
}: {
  data: SeriesPoint[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);

  if (total === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12px] text-faint">
        {emptyMessage}
      </p>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-5", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}
        className="shrink-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-raised)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
        {centerValue ? (
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="rotate-90 fill-ink text-[15px] font-medium"
            style={{ transformOrigin: "center" }}
          >
            {centerValue}
          </text>
        ) : null}
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-[12px]">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-muted">{d.label}</span>
            <span className="shrink-0 tabular text-ink">{d.value}</span>
            <span className="w-9 shrink-0 text-right tabular text-ghost">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
        {centerLabel ? <li className="pt-1 text-[11px] text-ghost">{centerLabel}</li> : null}
      </ul>
    </div>
  );
}

/* ------------------------------ RetentionCurve ----------------------------- */

/**
 * Average retention shown as a decay curve. Deliberately simple: with only an
 * average retention figure per asset, a fabricated per-second curve would be
 * dishonest, so this plots the actual points supplied and nothing more.
 */
export function RetentionCurve({
  points,
  height = 120,
  className,
  emptyMessage = "Retention data has not been recorded yet",
}: {
  points: { label: string; value: number }[];
  height?: number;
  className?: string;
  emptyMessage?: string;
}) {
  if (points.length < 2) return <EmptyChart height={height} message={emptyMessage} />;

  const width = 400;
  const innerH = height - 20;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: innerH - (Math.min(100, p.value) / 100) * innerH + 8,
    ...p,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        className="w-full"
        role="img"
        aria-label={`Retention curve across ${points.length} points`}
      >
        {[25, 50, 75].map((r) => (
          <line
            key={r}
            x1={0}
            x2={width}
            y1={innerH - (r / 100) * innerH + 8}
            y2={innerH - (r / 100) * innerH + 8}
            stroke="var(--color-line)"
            strokeDasharray="2 4"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="var(--color-info)"
          strokeWidth="1.75"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="var(--color-info)" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ghost">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- StageFunnel ------------------------------- */

/** Pipeline stage counts as a horizontal funnel. */
export function StageFunnel({
  stages,
  className,
}: {
  stages: { label: string; value: number; tone?: string }[];
  className?: string;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className={cn("space-y-2", className)}>
      {stages.map((stage, i) => {
        const pct = (stage.value / max) * 100;
        const dropOff =
          i > 0 && stages[i - 1]!.value > 0
            ? Math.round((stage.value / stages[i - 1]!.value) * 100)
            : null;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-[12px] text-muted">{stage.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-raised">
              <div
                className="flex h-full items-center rounded px-2 transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  backgroundColor: stage.tone ?? "var(--color-info)",
                  opacity: 0.85,
                }}
              >
                <span className="text-[11px] font-medium tabular text-[color:var(--color-base)]">{stage.value}</span>
              </div>
            </div>
            <span className="w-10 shrink-0 text-right text-[11px] tabular text-ghost">
              {dropOff != null ? `${dropOff}%` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
