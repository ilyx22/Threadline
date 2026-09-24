"use client";

import * as React from "react";
import { workshop } from "@/content/home";

/**
 * The Authority Workshop as a rail. Six stations across the top; below, the
 * object that changes hands at the chosen station, on a paper sheet, with
 * what happens and who decides. Every station's sheet is in the HTML, so the
 * section reads in full with scripting off; with it on, one sheet shows and
 * the marker under the rail moves to the chosen station. Arrow keys, Home
 * and End move between stations and carry focus.
 */
export default function Workshop() {
  const w = workshop;
  const [on, setOn] = React.useState(0);
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number, focus = false) => {
    const n = (i + w.stations.length) % w.stations.length;
    setOn(n);
    if (focus) tabs.current[n]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(on + 1, true);
    else if (e.key === "ArrowLeft") go(on - 1, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(w.stations.length - 1, true);
    else return;
    e.preventDefault();
  };
  return (
    <div className="h-workshop" data-on={on} style={{ ["--on" as string]: on }}>
      <div className="h-rail" role="tablist" aria-label={w.controls.group} onKeyDown={onKey}>
        {w.stations.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            id={`ws-tab-${s.key}`}
            aria-selected={i === on}
            aria-controls={`ws-panel-${s.key}`}
            tabIndex={i === on ? 0 : -1}
            className="h-rail-tab"
            ref={(el) => {
              tabs.current[i] = el;
            }}
            onClick={() => go(i)}
          >
            <span className="h-index">{s.n}</span>
            <span className="h-rail-title">{s.title}</span>
          </button>
        ))}
        <span className="h-rail-marker" aria-hidden="true" />
      </div>
      <div className="h-workshop-panels">
        {w.stations.map((s, i) => (
          <div key={s.key} id={`ws-panel-${s.key}`} role="tabpanel" aria-labelledby={`ws-tab-${s.key}`} className={`h-workshop-panel${i === on ? " is-on" : ""}`} hidden={undefined}>
            <div className="h-workshop-copy">
              <p className="h-label">
                {w.controls.station} {s.n} · {s.title}
              </p>
              <p className="h-workshop-plain">{s.plain}</p>
              <p className="h-workshop-decided">
                <span className="h-label">Decided</span>
                {s.decided}
              </p>
            </div>
            <div className="h-sheet h-workshop-sheet">
              <div className="h-sheet-head">
                <span className="h-label">{s.object.label}</span>
                {"stamp" in s.object && s.object.stamp ? <span className="h-stamp">{s.object.stamp}</span> : null}
              </div>
              <ul className="h-sheet-lines">
                {s.object.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <div className="h-sheet-foot">
                <span className="h-label">Station {s.n} of 06</span>
                <span className="h-sheet-rule" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="h-workshop-loop">{w.loop}</p>
    </div>
  );
}
