"use client";

import * as React from "react";
import { diagnosis } from "@/content/marketing-v5";
import { At, C, LINE, outline as O } from "./art/kit";

/**
 * SCENE 8: the testing bench. One piece sits on the bench on five component
 * blocks. Three measuring jars stand beside it with an expected mark pegged
 * on the glass. Run the loop: the actual level rises against the mark; the
 * weak block tips; the operator lifts it out with the hook and a fresh block
 * slides in; the jars are read again. Keyboard, touch and reduced motion all
 * land on the same states. Cases and values are illustrative and labelled so.
 */
const STEP_MS = 1600;
const COMPONENT_X = [-148, -74, 0, 74, 148];

export default function Bench() {
  const d = diagnosis;
  const [caseKey, setCaseKey] = React.useState<string>(d.cases[0].key);
  const [state, setState] = React.useState(0);
  const [lever, setLever] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  const c = d.cases.find((x) => x.key === caseKey) ?? d.cases[0];
  const applied = lever >= 60;
  const failIdx = d.components.indexOf(c.failing as (typeof d.components)[number]);

  React.useEffect(() => {
    if (!running) return;
    if (state >= 4) {
      setRunning(false);
      return;
    }
    timer.current = window.setTimeout(() => {
      if (state === 3) setLever(100);
      setState((s) => s + 1);
    }, state === 3 ? 1100 : STEP_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [running, state]);

  const pick = (key: string) => {
    setRunning(false);
    setCaseKey(key);
    setState(0);
    setLever(0);
  };
  const go = (s: number) => {
    setRunning(false);
    if (s < 3) setLever(0);
    if (s === 4 && !applied) setLever(100);
    setState(s);
  };
  const run = () => {
    setState(0);
    setLever(0);
    setRunning(true);
  };

  const showActual = state >= 1;
  const showWhy = state >= 2;
  const changing = state === 3;
  const retest = state === 4;
  const values = retest ? c.after : showActual ? c.actual : c.expected;
  const readout = state === 0 ? { verdict: "Expected", lines: c.gauges.map((g, i) => `${g}: about ${c.expected[i]} of 100`) } : state === 1 ? { verdict: "Actual", lines: c.gauges.map((g, i) => `${g}: ${c.actual[i]} of 100`) } : state === 2 ? c.why : state === 3 ? { verdict: c.change.verdict, lines: c.change.lines } : c.retest;

  const onTabKey = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? Math.min(4, state + 1) : e.key === "ArrowLeft" ? Math.max(0, state - 1) : e.key === "Home" ? 0 : 4;
    go(next);
    document.getElementById(`bench-tab-${next}`)?.focus();
  };

  return (
    <div className="v5-bench" data-state={state} data-applied={applied ? "true" : "false"}>
      <div className="v5-bench-top">
        <p className="v5-tag">{d.illustrative}</p>
        <div className="v5-cases" role="group" aria-label="Illustrative cases">
          {d.cases.map((x) => (
            <button key={x.key} type="button" className="v5-chip" aria-pressed={x.key === caseKey} onClick={() => pick(x.key)}>
              {x.title}
            </button>
          ))}
        </div>
      </div>

      <div className="v5-bench-stage">
        <svg viewBox="0 0 900 520" className="v5-art" role="img" aria-label={`The testing bench. The piece sits on five blocks: idea, hook, distribution, audience, destination. Three measuring jars, ${c.gauges.join(", ")}, each with an expected mark. ${state >= 1 ? "The actual level is shown." : ""} ${state >= 2 ? `The ${c.failing} block has tipped.` : ""} ${state >= 3 && applied ? `The ${c.failing} block has been replaced.` : ""} ${retest ? "The jars have been read again." : ""}`}>
          <rect x={0} y={0} width={900} height={520} rx={8} fill={C.mint} />
          {/* the bench */}
          <rect x={40} y={400} width={820} height={18} rx={2} fill={C.wood} {...O} />
          <path d="M80 418 V500 M820 418 V500" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          {/* the piece under test on its five blocks (generated pieces: docs/design/nano-banana-reference/generated/bench-pieces.jpg) */}
          <At x={310} y={400}>
            {d.components.map((name, i) => {
              const failed = showWhy && i === failIdx;
              const replaced = i === failIdx && (retest || (changing && applied));
              return (
                <g key={name} className={`v5-block${failed && !replaced ? " is-failed" : ""}${replaced ? " is-new" : ""}`} style={{ ["--bx" as string]: `${COMPONENT_X[i]}px` }}>
                  <g transform={`translate(${COMPONENT_X[i]} 0)`}>
                    <image href={replaced ? "/marketing/bench/block-new.png" : "/marketing/bench/block.png"} x={-33} y={-70} width={66} height={70} preserveAspectRatio="xMidYMax meet" />
                    {failed && !replaced ? <rect x={-30} y={-64} width={60} height={62} rx={6} fill={C.coral} opacity={0.55} /> : null}
                    <text x={0} y={16} textAnchor="middle" className="v5-label is-xs" textLength={Math.min(64, name.length * 6.6)} lengthAdjust="spacingAndGlyphs">
                      {name.toUpperCase()}
                    </text>
                  </g>
                </g>
              );
            })}
            <g className="v5-piece">
              <rect x={-190} y={-82} width={380} height={12} rx={1} fill={C.lilac} {...O} />
              <image href="/marketing/bench/sheet-easel.png" x={-60} y={-244} width={120} height={162} preserveAspectRatio="xMidYMax meet" />
              <text x={0} y={-256} textAnchor="middle" className="v5-label">THE PIECE · {c.title.toUpperCase()}</text>
            </g>
          </At>
          {/* the measuring jars: the jar is a generated piece, the level and the expected marker are drawn */}
          {c.gauges.map((g, i) => {
            const x = 580 + i * 100;
            const exp = c.expected[i];
            const val = values[i];
            const short = showActual && !retest && val < exp - 12;
            const over = showActual && !retest && val > exp + 12;
            return (
              <g key={g} transform={`translate(${x} 400)`}>
                <image href="/marketing/bench/jar.png" x={-40} y={-240} width={80} height={240} preserveAspectRatio="xMidYMax meet" />
                <rect x={-27} y={-16 - val * 1.8} width={54} height={val * 1.8} rx={4} fill={short ? C.coral : over ? C.butter : C.mintDeep} opacity={0.78} className="v5-fill" />
                <g transform={`translate(34 ${-16 - exp * 1.8})`}>
                  <image href="/marketing/bench/marker.png" x={-6} y={-16} width={30} height={30} preserveAspectRatio="xMidYMid meet" />
                  <path d="M-64 0 H-4" stroke={C.ink} strokeWidth={LINE} strokeDasharray="3 3" />
                </g>
                <text x={0} y={-258} textAnchor="middle" className="v5-label is-xs">{g.toUpperCase()}</text>
                <text x={0} y={-274} textAnchor="middle" className="v5-label is-lg">{val}</text>
              </g>
            );
          })}
          <text x={680} y={72} textAnchor="middle" className="v5-label is-xs" opacity={0.75}>EXPECTED MARK ▸ ACTUAL LEVEL · 0 TO 100 · ILLUSTRATIVE</text>
        </svg>
      </div>

      <div className="v5-bench-panel">
        <div className="v5-tabs" role="tablist" aria-label="Loop states" onKeyDown={onTabKey}>
          {d.states.map((s, i) => (
            <button key={s} id={`bench-tab-${i}`} type="button" role="tab" aria-selected={i === state} aria-controls="bench-readout" tabIndex={i === state ? 0 : -1} className="v5-tab" onClick={() => go(i)}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> {s}
            </button>
          ))}
        </div>
        <div id="bench-readout" role="tabpanel" aria-labelledby={`bench-tab-${state}`} className="v5-readout" aria-live="polite">
          <p className="v5-readout-verdict">{readout.verdict}</p>
          <ul>
            {readout.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {changing ? (
            <div className="v5-lever">
              <label htmlFor="bench-lever">{d.controls.lever}</label>
              <input id="bench-lever" type="range" min={0} max={100} value={lever} onChange={(e) => setLever(Number(e.target.value))} aria-valuetext={applied ? "Change applied" : "Not yet applied"} />
              <p className="v5-lever-note">{applied ? c.change.control : "Drag past the mark, or press Retest, to swap the part."}</p>
            </div>
          ) : null}
        </div>
        <div className="v5-bench-actions">
          <button type="button" className="v5-btn is-ghost" onClick={() => go(Math.max(0, state - 1))} disabled={state === 0}>
            {d.controls.back}
          </button>
          <button type="button" className="v5-btn is-ghost" onClick={() => go(Math.min(4, state + 1))} disabled={state === 4}>
            {d.controls.next}
          </button>
          <button type="button" className="v5-btn" onClick={run}>
            {d.controls.run}
          </button>
        </div>
        <p className="v5-note">{d.note}</p>
      </div>
    </div>
  );
}
