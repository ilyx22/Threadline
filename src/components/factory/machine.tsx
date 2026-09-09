"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { LineDiagram } from "./schematic";

/**
 * THE MACHINE — the homepage's signature section, v2.
 *
 * Nine stations as nodes on one thread. As the reader scrolls through the
 * section the nodes light in order and the current station's job is shown
 * beneath the line in one sentence. One rAF-throttled scroll listener writes
 * a progress value; no per-frame layout reads, no animation library. With
 * reduced motion, or before hydration, every node is lit and the last
 * station's caption is shown.
 *
 * What it teaches: the order of the work, and that each station does one job.
 */
export type MachineStation = { key: string; label: string; detail: string };

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
      const start = vh * 0.7;
      const end = -(rect.height - vh * 0.3);
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
  const currentIndex = Math.min(stations.length - 1, litCount - 1);
  const current = stations[currentIndex];

  return (
    <div ref={ref} className={cn("relative", !inView && "tl-paused")} data-machine-progress={progress.toFixed(2)}>
      {/* Desktop: one line. */}
      <div className="hidden md:block">
        <LineDiagram stations={stations} lit={litCount} active={armed ? currentIndex : undefined} />
        <div className="tl-rule mt-6 grid gap-2 pt-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-baseline">
          <p className="tl-label text-[color:var(--accent-deep)]">
            {String(currentIndex + 1).padStart(2, "0")} · {current.label}
          </p>
          <p className="text-[17px] leading-relaxed text-[color:var(--ink)]">{current.detail}</p>
        </div>
        <ol className="mt-6 grid grid-cols-9 gap-3" aria-label="Every station's job">
          {stations.map((s, i) => (
            <li key={s.key} className={cn("text-[12.5px] leading-snug transition-colors duration-300", i < litCount ? "text-[color:var(--ink-soft)]" : "text-[color:var(--ink-ghost)]")}>
              {s.detail}
            </li>
          ))}
        </ol>
      </div>

      {/* Below md: a vertical rail, one station per row, the current one highlighted. */}
      <div className="md:hidden">
        <ol className="relative ml-2 border-l border-[color:var(--line-strong)] pl-6" aria-label="The Threadline machine, station by station">
          {stations.map((s, i) => {
            const lit = i < litCount;
            return (
              <li key={s.key} className="tl-station relative py-4" data-lit={lit ? "true" : "false"}>
                <span aria-hidden className={cn("absolute -left-[31px] top-5 block size-3.5 rounded-full border border-[color:var(--ink)]", lit ? "bg-[color:var(--accent)] border-[color:var(--accent)]" : "bg-[color:var(--paper)]")} />
                <p className="tl-label text-[color:var(--ink)]">
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-snug text-[color:var(--ink-soft)]">{s.detail}</p>
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
