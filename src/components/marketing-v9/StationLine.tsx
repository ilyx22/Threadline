"use client";

import * as React from "react";
import Image from "next/image";
import { workshop } from "@/content/marketing-v5";

/**
 * The six-station line on How it works: the generated panorama with a marker
 * that moves to the chosen station, six numbered buttons (← → Home End on the
 * group) and the six captions, the chosen one lit. On phones the panorama is
 * wider than the screen and scrolls so the chosen station sits centred. All
 * six captions are in the HTML, so the line reads without scripting.
 */
const STATION_X = [0.09, 0.24, 0.4, 0.6, 0.76, 0.92]; // station centres as a share of the two-panel line

export default function StationLine() {
  const w = workshop;
  const [station, setStation] = React.useState(0);
  const scroller = React.useRef<HTMLDivElement>(null);
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(w.stations.length - 1, i));
    setStation(next);
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth + 8) {
      const img = el.firstElementChild as HTMLElement | null;
      const width = img?.offsetWidth ?? el.scrollWidth;
      el.scrollTo({ left: STATION_X[next] * width - el.clientWidth / 2, behavior: "smooth" });
    }
  };
  const onGroupKey = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? station + 1 : e.key === "ArrowLeft" ? station - 1 : e.key === "Home" ? 0 : w.stations.length - 1;
    go(next);
    buttons.current[Math.max(0, Math.min(w.stations.length - 1, next))]?.focus();
  };

  return (
    <div className="hw-line-stage" data-station={station} data-half={station < 3 ? 0 : 1}>
      <div ref={scroller} className="hw-stage-scroll">
        <div className="hw-stage-art" style={{ ["--x" as string]: `${STATION_X[station] * 100}%`, ["--hx" as string]: `${(STATION_X[station] * 2 - (station < 3 ? 0 : 1)) * 100}%` }}>
          <div className="hw-stage-halves">
            <Image src="/marketing/howitworks-line-left.jpg" alt="Stations one to three: a lamp over sorted note cards, a spool being wound on a hand winder, and a press with a written sheet, a small screen and a stapled document coming out of it, with the operator behind it." width={1376} height={768} sizes="(max-width: 991px) 700px, 620px" loading="eager" />
            <Image src="/marketing/howitworks-line-right.jpg" alt="Stations four to six: two doorways with a pegged line running in, a reading desk with three measuring jars and signal cards, and a low bench where one block is lifted out and a mint block waits." width={1376} height={768} sizes="(max-width: 991px) 700px, 620px" loading="eager" />
          </div>
          <span className="hw-stage-marker" aria-hidden="true">
            <span>{String(station + 1).padStart(2, "0")}</span>
          </span>
        </div>
      </div>
      <div className="hw-stage-controls" role="group" aria-label={w.controls.group} onKeyDown={onGroupKey}>
        <button type="button" className="hw-arrow" aria-label={w.controls.prev} onClick={() => go(station - 1)} disabled={station === 0}>
          ←
        </button>
        <ol className="hw-dots">
          {w.stations.map((s, i) => (
            <li key={s.key}>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                className="hw-dot"
                aria-pressed={i === station}
                aria-label={`${w.controls.station} ${i + 1}: ${s.title}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="hw-arrow" aria-label={w.controls.next} onClick={() => go(station + 1)} disabled={station === w.stations.length - 1}>
          →
        </button>
      </div>
      <ol className="hw-captions">
        {w.stations.map((s, i) => (
          <li key={s.key} className={i === station ? "is-on" : undefined} aria-current={i === station ? "step" : undefined}>
            <span className="v9-tag">
              {String(i + 1).padStart(2, "0")}
              <span className="hw-caption-of"> of 06</span>
            </span>
            <strong>{s.title}</strong>
            <em>{s.object}</em>
            <p>{s.plain}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
