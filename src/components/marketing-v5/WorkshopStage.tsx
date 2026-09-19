"use client";

import * as React from "react";
import { workshop } from "@/content/marketing-v5";
import { WorkshopArt } from "./art/WorkshopArt";

/**
 * SCENE 5 — the stage around the workshop panorama. Desktop: the panorama is
 * sticky while six sentinels scroll past underneath; each one that crosses
 * the middle of the viewport moves the root object to its station. Buttons
 * and arrow keys do the same. Phones: the camera pans along the bench one
 * station at a time. Without JavaScript every station caption is in the HTML
 * already; with it, the active one is shown.
 */
export default function WorkshopStage() {
  const w = workshop;
  const [station, setStation] = React.useState(0);
  const [inView, setInView] = React.useState(false);
  const sentinels = React.useRef<(HTMLLIElement | null)[]>([]);
  const stage = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const els = sentinels.current.filter(Boolean) as HTMLLIElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStation(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    const io2 = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), { threshold: 0.2 });
    if (stage.current) io2.observe(stage.current);
    return () => {
      io.disconnect();
      io2.disconnect();
    };
  }, []);

  const goTo = (i: number) => {
    const n = Math.max(0, Math.min(5, i));
    setStation(n);
    const el = sentinels.current[n];
    if (el && window.matchMedia("(min-width: 900px)").matches) el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(station + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(station - 1);
    }
  };

  return (
    <div className="v5-stage-wrap" data-inview={inView ? "true" : "false"}>
      <div ref={stage} className="v5-stage" data-station={station}>
        <div className="v5-stage-art" onKeyDown={onKey}>
          <WorkshopArt station={station} />
        </div>
        <div className="v5-stage-caption" aria-live="polite">
          <p className="v5-tag">
            {w.controls.station} {String(station + 1).padStart(2, "0")} of 06
          </p>
          <h3>{w.stations[station].title}</h3>
          <p className="v5-stage-object">{w.stations[station].object}</p>
          <p className="v5-stage-plain">{w.stations[station].plain}</p>
          <div className="v5-stage-controls" role="group" aria-label="Move along the bench">
            <button type="button" className="v5-btn is-ghost is-sm" onClick={() => goTo(station - 1)} disabled={station === 0} aria-label={w.controls.prev}>
              ←
            </button>
            <ol className="v5-stage-dots">
              {w.stations.map((s, i) => (
                <li key={s.key}>
                  <button type="button" className="v5-dot" aria-pressed={i === station} aria-label={`${w.controls.station} ${i + 1}: ${s.title}`} onClick={() => goTo(i)} />
                </li>
              ))}
            </ol>
            <button type="button" className="v5-btn is-ghost is-sm" onClick={() => goTo(station + 1)} disabled={station === 5} aria-label={w.controls.next}>
              →
            </button>
          </div>
        </div>
      </div>
      {/* the scroll track: one sentinel per station, and the readable list without JavaScript */}
      <ol className="v5-stage-track">
        {w.stations.map((s, i) => (
          <li
            key={s.key}
            data-i={i}
            ref={(el) => {
              sentinels.current[i] = el;
            }}
          >
            <span className="v5-tag">
              {String(i + 1).padStart(2, "0")}
            </span>
            <strong>{s.title}</strong>
            <span>{s.plain}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
