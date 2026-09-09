import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * THE AUTHORITY FACTORY — schematic primitives (v2).
 *
 * The factory is still the concept; this is the calmer rendering of it: a
 * system drawing rather than a cartoon. One thread, nodes for stations, a
 * spool for raw expertise, an inspection mark for gates, a routing fork for
 * distribution, a return loop for learning. 1.5px ink strokes, one accent,
 * no outlines thicker than the thread. Every part is a server-safe component;
 * motion comes from public.css classes and is off under reduced motion.
 */

type SvgProps = ComponentProps<"svg"> & { title?: string };

function Svg({ title, children, viewBox, className, ...rest }: SvgProps & { children: ReactNode; viewBox: string }) {
  return (
    <svg viewBox={viewBox} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------- Glyphs --- */

/** Raw expertise: a spool of thread. */
export function Spool({ className, accent }: { className?: string; accent?: boolean }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="A spool of thread: raw expertise">
      <rect x="14" y="8" width="20" height="32" rx="3" className="tl-thread" />
      <path d="M10 8h28M10 40h28" className="tl-thread" />
      <path d="M17 16h14M17 22h14M17 28h14M17 34h14" className={accent ? "tl-thread-accent" : "tl-thread-soft"} />
      <path d="M34 24c6 0 8 4 12 4" className={accent ? "tl-thread-accent" : "tl-thread"} />
    </Svg>
  );
}

/** Market intelligence: a lens over a line of text. */
export function Lens({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="A lens reading the market">
      <path d="M8 14h20M8 22h14M8 30h18M8 38h10" className="tl-thread-soft" />
      <circle cx="31" cy="27" r="9" className="tl-thread" />
      <path d="M38 34l6 6" className="tl-thread" />
    </Svg>
  );
}

/** Content decisions: one thread splitting. */
export function Fork({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="One idea, several expressions">
      <path d="M6 24h14" className="tl-thread-accent" />
      <path d="M20 24c8 0 8-12 18-12M20 24h18M20 24c8 0 8 12 18 12" className="tl-thread" />
      <circle cx="6" cy="24" r="3" fill="var(--accent)" />
    </Svg>
  );
}

/** Production: cut marks on a strip. */
export function Cut({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="Cut and packaged">
      <rect x="6" y="16" width="36" height="16" rx="3" className="tl-thread" />
      <path d="M18 12v24M30 12v24" className="tl-thread-soft" strokeDasharray="2 3" />
      <rect x="20" y="19" width="8" height="10" rx="1.5" fill="var(--accent)" />
    </Svg>
  );
}

/** Distribution: routing to three places. */
export function Route({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="Routed to where the buyer is">
      <path d="M6 24h12" className="tl-thread" />
      <path d="M18 24c6 0 6-10 14-10h8M18 24h22M18 24c6 0 6 10 14 10h8" className="tl-thread" />
      <circle cx="42" cy="14" r="2.5" fill="var(--ink)" />
      <circle cx="42" cy="24" r="2.5" fill="var(--accent)" />
      <circle cx="42" cy="34" r="2.5" fill="var(--ink)" />
    </Svg>
  );
}

/** Commercial response: a pulse coming back. */
export function Pulse({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="The market's answer">
      <path d="M6 28h8l4-12 6 20 5-14 3 6h10" className="tl-thread" />
      <circle cx="42" cy="28" r="3" fill="var(--signal)" />
    </Svg>
  );
}

/** Learning: a loop with an arrow. */
export function Loop({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="Diagnose, change one thing, retest">
      <path d="M36 20a13 13 0 1 0 2 10" className="tl-thread" />
      <path d="M38 10v10h-10" className="tl-thread" />
      <circle cx="24" cy="24" r="3" fill="var(--accent)" />
    </Svg>
  );
}

/** A gate: an inspection mark in a circle. */
export function InspectionMark({ className, reject }: { className?: string; reject?: boolean }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title={reject ? "Refused at the gate" : "Passed the gate"}>
      <circle cx="24" cy="24" r="16" className="tl-thread" />
      {reject ? <path d="M17 17l14 14M31 17L17 31" stroke="var(--reject)" strokeWidth="2" /> : <path d="M15 25l6 6 12-14" stroke="var(--signal)" strokeWidth="2" />}
    </Svg>
  );
}

/** A small package label: what a piece becomes. */
export function Package({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 48 48" className={cn("h-auto w-12", className)} title="A packaged piece">
      <rect x="8" y="12" width="32" height="26" rx="3" className="tl-thread" />
      <path d="M8 20h32" className="tl-thread-soft" />
      <path d="M14 28h12M14 32h8" className="tl-thread-soft" />
    </Svg>
  );
}

export const STAGE_GLYPH: Record<string, (p: { className?: string }) => ReactNode> = {
  raw: (p) => <Spool {...p} accent />,
  intel: (p) => <Lens {...p} />,
  decide: (p) => <Fork {...p} />,
  produce: (p) => <Cut {...p} />,
  distribute: (p) => <Route {...p} />,
  response: (p) => <Pulse {...p} />,
  learn: (p) => <Loop {...p} />,
};

/* ------------------------------------------------------------ Diagrams --- */

/**
 * The line: stations as nodes on one thread. `lit` nodes are filled, the
 * `active` node carries a halo and a breathing light. Labels sit beneath.
 */
export function LineDiagram({ stations, lit = stations.length, active, className, title = "The Threadline line, station by station", showLabels = true }: { stations: readonly { key: string; label: string }[]; lit?: number; active?: number; className?: string; title?: string; showLabels?: boolean }) {
  const W = 1000;
  const H = showLabels ? 118 : 70;
  const pad = 40;
  const step = (W - pad * 2) / Math.max(1, stations.length - 1);
  const y = 44;
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} title={title}>
      <path d={`M${pad} ${y} H${W - pad}`} className="tl-thread-soft" />
      {stations.map((s, i) => {
        const x = pad + i * step;
        const isLit = i < lit;
        const isActive = active === i;
        return (
          <g key={s.key} transform={`translate(${x} ${y})`}>
            <circle r="18" className={cn("tl-node-halo", isActive && "tl-light")} data-lit={isActive ? "true" : "false"} />
            <circle r={isActive ? 10 : 7} className="tl-node" data-lit={isLit ? "true" : "false"} />
            {showLabels ? (
              <text y="46" textAnchor="middle" className="tl-glyph-lbl" data-lit={isLit ? "true" : "false"}>
                {s.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </Svg>
  );
}

/**
 * The return thread: from the end of the line back to its start, with the
 * market's answer travelling along it. Still under reduced motion.
 */
export function ReturnThread({ className, width = 1000 }: { className?: string; width?: number }) {
  const d = `M ${width - 40} 20 C ${width - 40} 96, ${width * 0.6} 96, ${width * 0.5} 62 S 90 30, 40 82`;
  return (
    <Svg viewBox={`0 0 ${width} 110`} className={cn("h-auto w-full", className)} title="The market's answer travelling back to the start of the line">
      <path d={d} className="tl-thread-soft" />
      <path d={d} stroke="var(--signal)" strokeWidth="1.5" strokeDasharray="4 8" strokeLinecap="round" />
      <path d="M40 82 l-9 -7 M40 82 l-9 7" className="tl-thread" />
      <circle cx={width - 40} cy="20" r="4" fill="var(--ink)" />
      {/* the pulse moves in SVG units (so it scales with the drawing); reduced motion shows it at rest */}
      <circle r="5" fill="var(--signal)" className="tl-motion-only">
        <animateMotion dur="2.6s" repeatCount="indefinite" path={d} calcMode="spline" keySplines="0.45 0 0.55 1" keyTimes="0;1" />
      </circle>
      <circle cx={width * 0.5} cy="62" r="5" fill="var(--signal)" className="tl-still-only" />
    </Svg>
  );
}

/** One thesis branching into packages; draws on reveal. */
export function Branch({ branches = 6, className }: { branches?: number; className?: string }) {
  const H = 40 + branches * 44;
  return (
    <Svg viewBox={`0 0 420 ${H}`} className={cn("h-auto w-full", className)}>
      <path d="M20 50 C 80 50, 110 50, 150 50" className="tl-thread-accent tl-draw" style={{ ["--len" as string]: "160" }} />
      {Array.from({ length: branches }).map((_, i) => {
        const y = 30 + i * 44;
        return <path key={i} d={`M150 50 C 220 50, 240 ${y}, 320 ${y}`} className="tl-thread tl-draw" style={{ ["--len" as string]: "260", transitionDelay: `${180 + i * 90}ms` }} />;
      })}
      {Array.from({ length: branches }).map((_, i) => (
        <circle key={`d${i}`} cx="320" cy={30 + i * 44} r="3" fill="var(--ink)" />
      ))}
      <circle cx="20" cy="50" r="7" fill="var(--accent)" />
      <circle cx="150" cy="50" r="5" className="tl-node" />
    </Svg>
  );
}

/** Five encounters on one thread: stranger → conversation. */
export function MemoryThread({ stages, className }: { stages: readonly string[]; className?: string }) {
  const W = 800;
  const step = (W - 100) / Math.max(1, stages.length - 1);
  const d = `M50 60 ${stages
    .slice(1)
    .map((_, i) => `S ${50 + i * step + step / 2} ${i % 2 ? 24 : 96}, ${50 + (i + 1) * step} 60`)
    .join(" ")}`;
  return (
    <Svg viewBox={`0 0 ${W} 130`} className={cn("h-auto w-full", className)} title="The same buyer meeting the same clear thinking, five times">
      <path d={d} className="tl-thread-accent tl-draw" style={{ ["--len" as string]: "1400" }} />
      {stages.map((s, i) => {
        const x = 50 + i * step;
        const last = i === stages.length - 1;
        return (
          <g key={s} transform={`translate(${x} 60)`}>
            <circle r={last ? 10 : 7} className="tl-node" data-lit={last ? "true" : "false"} />
            {last ? <circle r="18" className="tl-node-halo" data-lit="true" /> : null}
            <text y="52" textAnchor="middle" className="tl-glyph-lbl hidden sm:block" data-lit={i > 0 ? "true" : "false"}>
              {s}
            </text>
          </g>
        );
      })}
    </Svg>
  );
}

/**
 * Twelve weeks on a rule with one four-week period filled. `period` is 0-based;
 * 3 means "week 13 onwards".
 */
export function PeriodTimeline({ period, className }: { period: number; className?: string }) {
  const W = 400;
  const left = 12;
  const right = 388;
  const weekW = (right - left) / 13;
  const start = left + period * 4 * weekW;
  const end = period >= 3 ? right : start + 4 * weekW;
  return (
    <Svg viewBox={`0 0 ${W} 76`} className={cn("h-auto w-full", className)} title={period >= 3 ? "Week thirteen onwards" : `Weeks ${period * 4 + 1} to ${period * 4 + 4} of twelve`}>
      <path d={`M${left} 40 H${right}`} className="tl-thread-soft" />
      {Array.from({ length: 13 }).map((_, i) => (
        <path key={i} d={`M${left + i * weekW} ${i % 4 === 0 ? 32 : 36} v${i % 4 === 0 ? 16 : 8}`} className="tl-thread-soft" />
      ))}
      <rect x={start} y="18" width={Math.max(8, end - start)} height="14" rx="7" fill={period >= 3 ? "var(--canvas)" : "var(--accent)"} stroke={period >= 3 ? "var(--line-strong)" : "none"} strokeDasharray={period >= 3 ? "3 3" : undefined} />
      {period >= 3 ? <path d={`M${right - 14} 20 l8 5 -8 5`} className="tl-thread" /> : null}
      <text x={left} y="66" className="tl-glyph-lbl" style={{ fontSize: 15 }}>
        wk 1
      </text>
      <text x={left + 4 * weekW} y="66" className="tl-glyph-lbl" textAnchor="middle" style={{ fontSize: 15 }}>
        5
      </text>
      <text x={left + 8 * weekW} y="66" className="tl-glyph-lbl" textAnchor="middle" style={{ fontSize: 15 }}>
        9
      </text>
      <text x={right} y="66" className="tl-glyph-lbl" textAnchor="end" style={{ fontSize: 15 }}>
        13+
      </text>
    </Svg>
  );
}

/**
 * The hero scene: raw expertise enters as a spool, travels the line, and
 * leaves as packages; the return thread brings the market's answer back.
 * Drawn wide and shallow so it can sit in the lower-right of the hero panel.
 */
export function HeroLine({ stations, className, compact }: { stations: readonly { key: string; label: string }[]; className?: string; compact?: boolean }) {
  const W = 900;
  const pad = compact ? 60 : 200;
  const step = (W - pad * 2 - 120) / Math.max(1, stations.length - 1);
  const y = compact ? 60 : 120;
  const H = compact ? 150 : 300;
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} title="Expertise goes in one end, content people want to watch comes out the other, and the market's answer comes back">
      {/* spool of raw expertise at the start of the line */}
      <g transform={`translate(${pad - 64} ${y - 30})`}>
        <rect x="0" y="4" width="30" height="52" rx="3" className="tl-thread" />
        <path d="M-6 4h42M-6 56h42" className="tl-thread" />
        <path d="M5 16h20M5 25h20M5 34h20M5 43h20" className="tl-thread-accent" />
      </g>
      <path d={`M${pad - 28} ${y} H${W - pad - 120}`} className="tl-thread-accent tl-draw" style={{ ["--len" as string]: "800" }} />
      {stations.map((s, i) => {
        const x = pad + i * step;
        return (
          <g key={s.key} transform={`translate(${x} ${y})`}>
            <circle r={compact ? 9 : 8} className="tl-node" data-lit={i < 3 ? "true" : "false"} />
            {compact ? null : (
              <text y="36" textAnchor="middle" className="tl-glyph-lbl" data-lit={i < 3 ? "true" : "false"} style={{ fontSize: 11 }}>
                {s.label}
              </text>
            )}
          </g>
        );
      })}
      {/* three packages leaving the line */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${W - pad - 108 + i * 42} ${y - 18})`}>
          <rect width="36" height="36" rx="5" className="tl-thread" fill="var(--paper)" />
          <path d="M7 13h22M7 20h15" className="tl-thread-soft" />
          {i === 1 ? <rect x="7" y="25" width="14" height="4" rx="1" fill="var(--accent)" /> : null}
        </g>
      ))}
      {compact ? null : (
        <>
          {/* the return thread, with the market's answer travelling back */}
          <path d={`M${W - pad - 6} ${y + 30} C ${W - pad - 6} 236, ${W * 0.55} 236, ${W * 0.5} 206 S 200 176, ${pad - 40} 222`} className="tl-thread-soft" strokeDasharray="4 8" />
          <path d={`M${pad - 40} 222 l-9 -7 M${pad - 40} 222 l-9 7`} className="tl-thread" />
          <circle cx={W * 0.5} cy="206" r="5" fill="var(--signal)" className="tl-light" />
          <text x={W * 0.5} y="262" textAnchor="middle" className="tl-glyph-lbl" style={{ fontSize: 12 }}>
            back: what the market did
          </text>
        </>
      )}
    </Svg>
  );
}
