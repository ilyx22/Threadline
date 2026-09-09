"use client";

import * as React from "react";

/**
 * Twelve weeks as one continuous band. Many thin hypothesis lines at the start;
 * as the reader scrolls, most fade and a few validated patterns thicken and
 * carry through. Four period stops light in order. Reduced motion shows the
 * end of period three.
 */
export function Progression({ periods, legend }: { periods: readonly { label: string; title: string; body: string }[]; legend: { hypotheses: string; validated: string } }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [p, setP] = React.useState(0.78);
  React.useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect();
      const vh = window.innerHeight;
      setP(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.85 + r.height * 0.4))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const W = 1000;
  const stops = [60, 340, 620, 900];
  const hyps = [30, 60, 88, 112, 136, 150, 165, 178];
  const validated = [{ y: 92, seed: 0.35 }, { y: 120, seed: 0.55 }, { y: 150, seed: 0.8 }];
  const ease = (x: number) => Math.min(1, Math.max(0, x));
  return (
    <div ref={ref} className="tl-prog">
      <div className="tl-prog-band">
        <svg viewBox={`0 0 ${W} 240`} aria-hidden>
          {hyps.map((y, i) => {
            const fadeAt = 0.25 + (i / hyps.length) * 0.6;
            const o = p < fadeAt ? 0.7 : Math.max(0.08, 0.7 - (p - fadeAt) * 2.2);
            const len = 60 + Math.min(W - 120, p * (W + 200) - i * 40);
            return <path key={i} className="tl-prog-hyp" d={`M60 ${y} H${Math.max(60, len)}`} style={{ ["--o" as string]: o }} />;
          })}
          {validated.map((v, i) => {
            const start = 0.3 + i * 0.12;
            const grow = ease((p - start) / 0.5);
            const width = 2 + grow * 8;
            const x2 = 60 + grow * (W - 120);
            return <path key={i} className="tl-prog-val" d={`M60 ${v.y} H${x2}`} style={{ strokeWidth: width, opacity: grow > 0 ? 0.9 : 0 }} />;
          })}
          <path className="tl-prog-base" d={`M40 210 H${W - 40}`} />
          {stops.map((x, i) => (
            <g key={x}>
              <circle className="tl-prog-stop" cx={x} cy="210" r="9" data-on={p >= (i + 0.5) / stops.length - 0.12 ? "true" : "false"} />
              <text className="tl-prog-lbl" x={x} y="238" textAnchor="middle">
                {periods[i]?.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="tl-prog-legend" aria-hidden>
          <span>{legend.hypotheses}</span>
          <span>{legend.validated}</span>
        </div>
      </div>
      <ol className="tl-prog-periods">
        {periods.map((pe, i) => (
          <li key={pe.label} className="tl-prog-period" data-on={p >= (i + 0.5) / periods.length - 0.12 ? "true" : "false"}>
            <p className="tl-label text-[color:var(--accent-deep)]">{pe.label}</p>
            <p className="tl-sub-title mt-2 text-[1.25rem]">{pe.title}</p>
            <p className="tl-body mt-2 text-[14.5px]">{pe.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
