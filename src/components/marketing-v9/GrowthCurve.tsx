import * as React from "react";

/**
 * A small compounding curve (26 September 2026): flat for the first month,
 * bending by the second, steep by the third. The chart is split into thirds;
 * each stage's dot and label sit at the centre of its third. The line draws
 * itself when the section is seen. Labels are HTML so they read at phone size.
 */
const STAGES = [
  { day: "Day 30", line: "It feels quiet" },
  { day: "Day 60", line: "The evidence starts" },
  { day: "Day 90", line: "It compounds" },
] as const;

const W = 600;
const BASE = 176;
const RISE = 158;
const K = 3.2;
const y = (x: number) => BASE - (RISE * (Math.exp((K * x) / W) - 1)) / (Math.exp(K) - 1);
const PATH = Array.from({ length: 61 }, (_, i) => {
  const x = (i / 60) * W;
  return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y(x).toFixed(1)}`;
}).join(" ");
const CENTRES = [W / 6, W / 2, (5 * W) / 6];

export function GrowthCurve({ note }: { note: string }) {
  return (
    <figure className="v9-curve v9-reveal">
      <svg viewBox={`0 0 ${W} 200`} className="v9-curve-art" aria-hidden="true">
        <path d={`M0 180 H${W}`} stroke="currentColor" strokeWidth={1.4} opacity={0.2} />
        {[W / 3, (2 * W) / 3].map((x) => (
          <path key={x} d={`M${x} 180 V14`} stroke="currentColor" strokeWidth={1} strokeDasharray="3 5" opacity={0.18} />
        ))}
        <path className="v9-curve-path" d={PATH} fill="none" stroke="var(--v5-gold)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} />
        {CENTRES.map((x, i) => (
          <circle key={x} cx={x} cy={y(x)} r={i === 2 ? 7 : 6} fill="var(--v5-gold)" stroke="var(--v9-ink)" strokeWidth={1.5} className="v9-curve-dot" />
        ))}
      </svg>
      <ol className="v9-curve-stages">
        {STAGES.map((s) => (
          <li key={s.day}>
            <span className="v9-tag">{s.day}</span>
            <strong>{s.line}</strong>
          </li>
        ))}
      </ol>
      <figcaption className="v9-curve-note">{note}</figcaption>
    </figure>
  );
}
