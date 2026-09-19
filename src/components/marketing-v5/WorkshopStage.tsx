"use client";

import * as React from "react";
import { workshop } from "@/content/marketing-v5";
import { STATION_X, WORKSHOP_W, WorkshopArt } from "./art/WorkshopArt";

/**
 * SCENE 5 — the stage around the workshop panorama. The whole bench is
 * visible at once with every station named, so the mechanism reads at a
 * glance and without JavaScript. Choosing a station (the numbered buttons,
 * or ← → while one of them has focus) moves the root object there and opens
 * that station's line. On phones the panorama is wider than the screen and
 * the camera pans so the chosen station sits centred, never past the edge.
 */
const PAN_SCALE = 4; // one station fills the phone frame without clipping a neighbour's label
const pans = STATION_X.map((x) => {
  const centre = x / WORKSHOP_W;
  const window = 1 / PAN_SCALE;
  return Math.min(1 - window, Math.max(0, centre - window / 2));
});

export default function WorkshopStage() {
  const w = workshop;
  const [station, setStation] = React.useState(0);
  const [inView, setInView] = React.useState(false);
  const stage = React.useRef<HTMLDivElement>(null);
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = (i: number, focus = false) => {
    const n = Math.max(0, Math.min(5, i));
    setStation(n);
    if (focus) buttons.current[n]?.focus();
  };
  const onGroupKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goTo(station + 1, true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goTo(station - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(5, true);
    }
  };

  return (
    <div ref={stage} className="v5-stage" data-station={station} data-inview={inView ? "true" : "false"} style={{ ["--pan" as string]: `${(pans[station] * 100).toFixed(2)}%`, ["--pan-scale" as string]: `${PAN_SCALE * 100}%` }}>
      <div className="v5-stage-art">
        <WorkshopArt station={station} />
      </div>
      <div className="v5-stage-controls" role="group" aria-label={w.controls.group} onKeyDown={onGroupKey}>
        <button type="button" className="v5-btn is-ghost is-sm" onClick={() => goTo(station - 1)} disabled={station === 0} aria-label={w.controls.prev}>
          ←
        </button>
        <ol className="v5-stage-dots">
          {w.stations.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                className="v5-dot"
                aria-pressed={i === station}
                aria-label={`${w.controls.station} ${i + 1}: ${s.title}`}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                onClick={() => goTo(i)}
              >
                <span aria-hidden="true">{i + 1}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="v5-btn is-ghost is-sm" onClick={() => goTo(station + 1)} disabled={station === 5} aria-label={w.controls.next}>
          →
        </button>
      </div>
      <ol className="v5-stations" aria-label="The six stations">
        {w.stations.map((s, i) => (
          <li key={s.key} data-on={i === station ? "true" : "false"}>
            <span className="v5-tag">{String(i + 1).padStart(2, "0")}</span>
            <strong>{s.title}</strong>
            <span className="v5-station-object">{s.object}</span>
            <span className="v5-station-plain">{s.plain}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
