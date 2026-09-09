"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { AssemblyStation, BuilderStation, Conveyor, DistributionSorter, InspectorStation, RecordStation, ScannerStation } from "./primitives";

/**
 * THE MACHINE — the homepage's signature section.
 *
 * Nine stations on one line. As the reader scrolls through the section the
 * stations light up in order and the belt runs; the copy for the lit station
 * is shown beside it. One rAF-throttled scroll listener writes a progress
 * value; no per-frame layout reads, no animation library. With reduced
 * motion, or before hydration, every station is lit and the belt is still.
 *
 * What it teaches: the order of the work, and that each station does one job.
 */
export type MachineStation = { key: string; label: string; detail: string };

const ART: Record<string, React.ComponentType<{ lit?: boolean; className?: string }>> = {
  understand: ScannerStation,
  research: ScannerStation,
  signals: InspectorStation,
  ideas: AssemblyStation,
  script: AssemblyStation,
  record: RecordStation,
  produce: BuilderStation,
  approve: InspectorStation,
  distribute: DistributionSorter,
};

export function MachineLine({ stations }: { stations: readonly MachineStation[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(1); // 1 = everything lit (SSR / reduced motion)
  const [inView, setInView] = React.useState(true);
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    setArmed(true);
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the section top reaches the lower third of the viewport, 1 when its bottom reaches the upper third.
      const start = vh * 0.66;
      const end = -(rect.height - vh * 0.33);
      const p = (start - rect.top) / (start - end);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), { threshold: 0.05 });
    io.observe(node);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const litCount = armed ? Math.max(1, Math.ceil(progress * stations.length)) : stations.length;
  const current = stations[Math.min(stations.length - 1, litCount - 1)];

  return (
    <div ref={ref} className={cn("relative", !inView && "tl-paused")} data-machine-progress={progress.toFixed(2)}>
      {/* Desktop: one long line. */}
      <div className="hidden lg:block">
        <ol className="grid grid-cols-9 gap-2" aria-label="The Threadline machine, station by station">
          {stations.map((s, i) => {
            const Art = ART[s.key] ?? AssemblyStation;
            const lit = i < litCount;
            return (
              <li key={s.key} className="tl-station flex flex-col items-center text-center" data-lit={lit ? "true" : "false"}>
                <Art lit={lit} className="w-[110px]" />
                <span className="tl-label mt-3 text-[color:var(--ink)]">{s.label}</span>
              </li>
            );
          })}
        </ol>
        <Conveyor className="mt-4" label="the line" />
        <div className="mt-8 grid grid-cols-9 gap-2">
          {stations.map((s, i) => (
            <p key={s.key} className={cn("text-[13px] leading-snug transition-opacity duration-300", i < litCount ? "text-[color:var(--ink-soft)]" : "text-[color:var(--ink-ghost)]")}>
              {s.detail}
            </p>
          ))}
        </div>
      </div>

      {/* Below lg: a vertical conveyor, one station per row, the current one highlighted. */}
      <div className="lg:hidden">
        <ol className="relative border-l-[3px] border-[color:var(--belt)] pl-6" aria-label="The Threadline machine, station by station">
          {stations.map((s, i) => {
            const Art = ART[s.key] ?? AssemblyStation;
            const lit = i < litCount;
            return (
              <li key={s.key} className="tl-station relative flex items-start gap-4 py-4" data-lit={lit ? "true" : "false"}>
                <span aria-hidden className={cn("absolute -left-[33px] top-9 block size-4 rounded-full border-2 border-[color:var(--ink)]", lit ? "bg-[color:var(--stamp)]" : "bg-[color:var(--paper)]")} />
                <Art lit={lit} className="w-[92px] shrink-0" />
                <div className="min-w-0 pt-1">
                  <p className="tl-label text-[color:var(--ink)]">{s.label}</p>
                  <p className="mt-1.5 text-[14px] leading-snug text-[color:var(--ink-soft)]">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="sr-only" aria-live="polite">
        Current station: {current.label}. {current.detail}
      </p>
    </div>
  );
}
