import * as React from "react";

/**
 * A small compounding curve (26 September 2026): flat for the first month,
 * bending by the second, steep by the third. The line draws itself when the
 * section is seen. The three stages are HTML so they read at phone size.
 */
const STAGES = [
  { day: "Day 30", line: "It feels quiet" },
  { day: "Day 60", line: "The evidence starts" },
  { day: "Day 90", line: "It compounds" },
] as const;

export function GrowthCurve({ note }: { note: string }) {
  return (
    <figure className="v9-curve v9-reveal">
      <svg viewBox="0 0 600 200" className="v9-curve-art" aria-hidden="true">
        <path d="M20 180 H580" stroke="currentColor" strokeWidth={1.4} opacity={0.2} />
        {[200, 400, 580].map((x) => (
          <path key={x} d={`M${x} 180 V20`} stroke="currentColor" strokeWidth={1} strokeDasharray="3 5" opacity={0.2} />
        ))}
        <path className="v9-curve-path" d="M20 176 C 180 174 290 168 380 138 S 520 60 580 18" fill="none" stroke="var(--v5-gold)" strokeWidth={3.5} strokeLinecap="round" pathLength={100} />
        <circle cx={200} cy={170} r={6} fill="var(--v5-gold)" stroke="var(--v9-ink)" strokeWidth={1.5} className="v9-curve-dot" />
        <circle cx={400} cy={128} r={6} fill="var(--v5-gold)" stroke="var(--v9-ink)" strokeWidth={1.5} className="v9-curve-dot" />
        <circle cx={580} cy={18} r={7} fill="var(--v5-gold)" stroke="var(--v9-ink)" strokeWidth={1.5} className="v9-curve-dot" />
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
