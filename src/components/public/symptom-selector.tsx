"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Symptom selector — Threadline mutation of the frozen clone
 * `reference-analysis/clones/hydra-constraint-selector` (see its FROZEN.md).
 *
 * Kept from the skeleton: pill tabs → a diagram panel whose stage strokes
 * react to the selection → a symptom card beside a dark "what changes" card;
 * the 1.2fr/1fr grid, the 12px surfaces, the 150ms / 300ms / 500ms easings;
 * tabs become a 2-column grid and the diagram hides below 640px.
 *
 * Threadline's: the four symptoms are the existing "problem" points, word for
 * word; the diagram is Threadline's seven-stage line; the dark card shows the
 * existing how-it-works stage copy for the station where that symptom is
 * addressed. No new narrative copy — only interaction labels.
 */
export type Symptom = { title: string; body: string };
export type Stage = { key: string; title: string; body: string };

/** Which stage of the line addresses each symptom, in the symptoms' order. */
const STAGE_FOR: readonly string[] = ["decide", "intel", "produce", "learn"];

export function SymptomSelector({ symptoms, stages, howItWorksHref = "/how-it-works" }: { symptoms: readonly Symptom[]; stages: readonly Stage[]; howItWorksHref?: string }) {
  const [selected, setSelected] = React.useState(0);
  const stageKey = STAGE_FOR[selected] ?? stages[0]?.key;
  const stage = stages.find((s) => s.key === stageKey) ?? stages[0];
  const stageIndex = Math.max(0, stages.findIndex((s) => s.key === stage?.key));
  const symptom = symptoms[selected];
  const tabId = (i: number) => `symptom-tab-${i}`;
  const panelId = "symptom-panel";

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const n = symptoms.length;
    const next = e.key === "ArrowRight" ? (selected + 1) % n : e.key === "ArrowLeft" ? (selected - 1 + n) % n : e.key === "Home" ? 0 : n - 1;
    setSelected(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div>
      <div className="tl-tabs" role="tablist" aria-label="Choose the symptom that sounds like you" onKeyDown={onKey}>
        {symptoms.map((s, i) => (
          <button key={s.title} id={tabId(i)} type="button" role="tab" aria-selected={i === selected} aria-controls={panelId} tabIndex={i === selected ? 0 : -1} className="tl-tab" onClick={() => setSelected(i)}>
            <span className="tl-tab-idx" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.title}
          </button>
        ))}
      </div>

      <div className="tl-selector-panel" aria-hidden>
        <StageStrokes stages={stages} active={stageIndex} />
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={tabId(selected)} className="tl-selector-cards">
        <div className="tl-detail">
          <p className="tl-label">
            Symptom {String(selected + 1).padStart(2, "0")} of {String(symptoms.length).padStart(2, "0")}
          </p>
          <p className="tl-sub-title mt-3 text-[color:var(--ink)]">{symptom.title}</p>
          <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--ink-soft)]">{symptom.body}</p>
        </div>
        <div className="tl-detail-dark">
          <div>
            <p className="tl-label">Where the line fixes it</p>
            <p className="mt-3 text-[18px] font-medium leading-snug">
              {String(stageIndex + 1).padStart(2, "0")} · {stage.title}
            </p>
            <p className="mt-3 text-[16px] leading-relaxed text-[color:var(--paper)] opacity-90">{stage.body}</p>
          </div>
          <Link href={`${howItWorksHref}#${stage.key}`} className="tl-btn tl-btn-sm self-start border-[color:var(--paper)] bg-[color:var(--paper)] text-[color:var(--ink)] hover:bg-[color:var(--stamp-soft)] hover:text-[color:var(--ink)]">
            See how the line works
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {symptom.title}: addressed at {stage.title}.
      </p>
    </div>
  );
}

/** The stage strokes: seven stages as round-capped strokes; the active one fills with the accent. */
function StageStrokes({ stages, active }: { stages: readonly Stage[]; active: number }) {
  const W = 1120;
  const n = stages.length;
  const gap = 24;
  const w = (W - 80 - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 ${W} 200`} className="block h-auto w-full" aria-hidden>
      {stages.map((s, i) => {
        const x = 40 + i * (w + gap);
        const on = i === active;
        return (
          <g key={s.key} className={cn("tl-stage")} data-on={on ? "true" : "false"} transform={`translate(${x} 0)`}>
            <text className="tl-stage-lbl" x={w / 2} y="42" textAnchor="middle">
              {s.title}
            </text>
            <path className="tl-stage-outer" d={`M18 100 H${w - 18}`} />
            <path className="tl-stage-inner" d={`M18 100 H${w - 18}`} />
            <circle className="tl-stage-dot" cx={w / 2} cy="100" r="5" fill="var(--ink-ghost)" />
            {on ? (
              <text className="tl-stage-lbl" x={w / 2} y="157" textAnchor="middle" data-on="true">
                ↑ addressed here
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
