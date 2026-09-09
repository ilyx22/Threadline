"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Chamber, ThesisCard } from "@/components/factory/objects";

/**
 * THE AUTHORITY FACTORY — the site's centrepiece.
 *
 * Seven chambers on one rail. An idea card travels along the rail as the
 * reader scrolls (one rAF-throttled listener, transform only); the chamber it
 * is in lifts and shows what happens there. Any chamber can also be pressed,
 * which holds it open. The founder's four touchpoints carry a badge. Below
 * 640px the rail is a vertical accordion, one chamber open at a time, and the
 * travelling card is hidden. Reduced motion: no scroll link; press to explore.
 */
export type ChamberSpec = { key: string; label: string; items: readonly string[]; founder?: string; plain: string };

export function Factory({ chambers, loop }: { chambers: readonly ChamberSpec[]; loop: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const [held, setHeld] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setArmed(true);
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.75;
      const end = vh * 0.15 - rect.height * 0.35;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      setProgress(p);
      setScrollIndex(Math.min(chambers.length - 1, Math.floor(p * chambers.length)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [chambers.length]);

  const active = held ?? scrollIndex;
  const current = chambers[active];
  const cardStyle: React.CSSProperties = { transform: `translateX(calc(${progress} * (100cqw - 150px)))` };

  return (
    <div ref={ref} id="factory" className="tl-factory scroll-mt-24">
      <div className="tl-factory-track" style={{ containerType: "inline-size" }} aria-hidden>
        {armed ? (
          <div className="tl-factory-card" style={cardStyle}>
            <ThesisCard title="One idea, travelling the line" label="In the line" compact lines={1} />
          </div>
        ) : null}
      </div>
      <div ref={railRef} className="tl-factory-rail" role="group" aria-label="The seven stations of the Authority Factory">
        {chambers.map((c, i) => (
          <Chamber key={c.key} id={`station-${c.key}`} index={String(i + 1).padStart(2, "0")} label={c.label} active={i === active} onClick={() => setHeld((h) => (h === i ? null : i))} className={cn(i === active && "tl-chamber-active")}>
            {c.founder ? <span className="tl-factory-founder">You · {c.founder}</span> : null}
            <ul className="tl-factory-items">
              {c.items.map((it) => (
                <li key={it} className="tl-item">
                  {it}
                </li>
              ))}
            </ul>
          </Chamber>
        ))}
      </div>
      <div className="tl-factory-detail" aria-live="polite">
        <div>
          <p className="tl-label text-[color:var(--accent-deep)]">
            {String(active + 1).padStart(2, "0")} · {current.label}
          </p>
          {current.founder ? <p className="mt-2 text-[13.5px] font-medium text-[color:var(--ink)]">You: {current.founder.toLowerCase()}. Threadline: everything else here.</p> : <p className="mt-2 text-[13.5px] text-[color:var(--ink-faint)]">No founder time at this station.</p>}
        </div>
        <p className="text-[17px] leading-relaxed text-[color:var(--ink)]">{current.plain}</p>
      </div>
      <p className="tl-factory-loop text-[14px] font-medium text-[color:var(--signal)]">
        <span aria-hidden>↺</span> {loop}
      </p>
    </div>
  );
}
