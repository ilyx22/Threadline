"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ScoreCard, ThesisCard } from "@/components/factory/objects";

/**
 * EXPECTED → ACTUAL → WHY → CHANGE → RETEST, on one content asset.
 * A tablist of five states; the panel shows the reading for the selected
 * state; RETEST nudges the asset card back toward the start of the line.
 * Keyboard: arrows move between states. Values are illustrative and say so.
 */
export type LoopState = { key: string; label: string; headline: string; score?: string; lines: readonly string[]; note?: string };

export function LearningLoop({ asset, states }: { asset: { title: string; meta: string }; states: readonly LoopState[] }) {
  const [i, setI] = React.useState(0);
  const s = states[i];
  const id = (k: string) => `loop-${k}`;
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n = states.length;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : n - 1;
    setI(next);
    document.getElementById(id(states[next].key))?.focus();
  };
  return (
    <div className="tl-loop" data-state={s.key}>
      <div className="tl-loop-rail" role="tablist" aria-label="The learning loop, state by state" onKeyDown={onKey}>
        {states.map((st, k) => (
          <button key={st.key} id={id(st.key)} type="button" role="tab" aria-selected={k === i} aria-controls="loop-panel" tabIndex={k === i ? 0 : -1} className="tl-loop-state" onClick={() => setI(k)}>
            <span className="tl-loop-idx" aria-hidden>
              {String(k + 1).padStart(2, "0")}
            </span>
            {st.label}
          </button>
        ))}
      </div>
      <div className="tl-loop-stage">
        <div className="tl-loop-asset">
          <ThesisCard title={asset.title} label={asset.meta} compact lines={2} />
        </div>
        <div id="loop-panel" role="tabpanel" aria-labelledby={id(s.key)} className="tl-loop-panel">
          <div>
            <p className="tl-label text-[color:var(--accent-deep)]">
              {String(i + 1).padStart(2, "0")} · {s.label}
            </p>
            {s.key === "why" ? <p className="mt-3"><span className="tl-loop-verdict">{s.headline}</span></p> : <p className="tl-sub-title mt-2 text-[1.25rem] text-[color:var(--ink)]">{s.headline}</p>}
            <ul className="tl-loop-lines">
              {s.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {s.note ? <p className="mt-3 text-[13.5px] leading-relaxed text-[color:var(--ink-faint)]">{s.note}</p> : null}
          </div>
          <div className={cn("flex flex-col gap-3", !s.score && "justify-end")}>
            {s.score ? (
              <ScoreCard label="Expected" value={s.score} tone="stamp" />
            ) : s.key === "retest" ? (
              <ScoreCard label="Status" tone="signal">
                <span className="text-[15px] font-semibold text-[color:var(--signal)]">Back on the line</span>
              </ScoreCard>
            ) : (
              <ScoreCard label={s.key === "actual" ? "Read at" : s.key === "why" ? "Classified as" : "Lever"} tone="paper">
                <span className="text-[15px] font-medium text-[color:var(--ink)]">{s.key === "actual" ? "14 days" : s.key === "why" ? "Packaging" : "One change"}</span>
              </ScoreCard>
            )}
          </div>
        </div>
        <div className="tl-loop-nav">
          <button type="button" className="tl-btn tl-btn-sm" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
            ← Back
          </button>
          <button type="button" className="tl-btn tl-btn-primary tl-btn-sm" onClick={() => setI((k) => (k + 1) % states.length)}>
            {i === states.length - 1 ? "Run it again" : "Next"} →
          </button>
        </div>
      </div>
    </div>
  );
}
