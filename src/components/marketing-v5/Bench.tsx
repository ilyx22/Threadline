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
const COMPONENT_X = [-148, -74, 0, 74, 148];

export default function Bench() {
  const d = diagnosis;
  const jarId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const [state, setState] = React.useState(0);
  const [lever, setLever] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [seen, setSeen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const c = d.cases[0];
  const applied = lever >= 60;
  const failIdx = d.components.indexOf(c.failing as (typeof d.components)[number]);

  /* the loop plays itself once the bench is in view: each state holds long enough to read, the change is applied a beat
     after the block lifts, and after the retest it starts again. Hover, focus or a tap on a step pauses it; reduced motion never starts it. */
  React.useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  /* the change lands whether the loop is running or a reader tapped straight to it */
  React.useEffect(() => {
    if (state !== 3) return;
    const t = window.setTimeout(() => setLever(100), 1100);
    return () => window.clearTimeout(t);
  }, [state]);
  React.useEffect(() => {
    if (!seen || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(
        () => {
          if (state === 4) {
            setLever(0);
            setState(0);
          } else {
            setState(state + 1);
          }
        },
        state === 3 ? 2800 : state === 4 ? 3400 : 2600,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [seen, paused, state]);

  const go = (s: number) => {
    if (s < 3) setLever(0);
    if (s >= 3) setLever(100);
    setState(s);
  };

  /* phones: the drawing is wider than the screen, so the stage slides to the part each step talks about (jars for the readings, blocks for the fault and the fix) */
  const stage = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = stage.current;
    if (!el || el.scrollWidth <= el.clientWidth + 8) return;
    const blocks = state === 2 || state === 3;
    const left = blocks ? Math.max(0, el.scrollWidth * 0.34 - el.clientWidth / 2) : el.scrollWidth - el.clientWidth;
    el.scrollTo({ left, behavior: "smooth" });
  }, [state]);

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
    <div
      ref={root}
      className="v5-bench"
      data-state={state}
      data-applied={applied ? "true" : "false"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <p className="v5-bench-case">
        <span className="pb-stamp">Illustrative</span>
        <span>{c.title}. Not a client result.</span>
      </p>
      <div className="v5-tabs v5-bench-steps" role="tablist" aria-label="Loop states" onKeyDown={onTabKey}>
        {d.states.map((st, i) => (
          <button key={st} id={`bench-tab-${i}`} type="button" role="tab" aria-selected={i === state} aria-controls="bench-readout" tabIndex={i === state ? 0 : -1} className="v5-tab" onClick={() => go(i)}>
            <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> {st}
          </button>
        ))}
      </div>

      <div className="v5-bench-stage" ref={stage}>
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
                    <text x={0} y={16} textAnchor="middle" className="v5-label is-xs">
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
          {/* the measuring jars: drawn glass, a level that rises, a pegged expected mark and a scale (26 September 2026) */}
          {c.gauges.map((g, i) => {
            const x = 580 + i * 100;
            const exp = c.expected[i];
            const val = values[i];
            const short = showActual && !retest && val < exp - 12;
            const over = showActual && !retest && val > exp + 12;
            const clip = `${jarId}-${i}`;
            return (
              <g key={g} transform={`translate(${x} 400)`}>
                <defs>
                  <clipPath id={clip}>
                    <rect x={-33} y={-234} width={66} height={220} rx={12} />
                  </clipPath>
                </defs>
                <rect className="v5-jar-glass" x={-33} y={-234} width={66} height={220} rx={12} fill="#fff" fillOpacity={0.62} stroke={C.ink} strokeWidth={LINE} />
                <rect className="v5-fill" clipPath={`url(#${clip})`} x={-33} y={-16 - val * 1.8} width={66} height={val * 1.8 + 4} fill={short ? C.coral : over ? C.butter : C.mintDeep} opacity={0.85} />
                <path d="M-22 -218 V-40" stroke="#fff" strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
                {[20, 40, 60, 80].map((t) => (
                  <path key={t} d={`M20 ${-16 - t * 1.8} H29`} stroke={C.ink} strokeWidth={1.4} opacity={0.42} />
                ))}
                <rect x={-38} y={-246} width={76} height={14} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={LINE} />
                <g transform={`translate(0 ${-16 - exp * 1.8})`}>
                  <path d="M-33 0 H33" stroke={C.ink} strokeWidth={LINE} strokeDasharray="4 3" />
                  <rect x={31} y={-7} width={20} height={14} rx={4} fill="var(--v5-gold)" stroke={C.ink} strokeWidth={LINE} />
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
        <div id="bench-readout" role="tabpanel" aria-labelledby={`bench-tab-${state}`} className="v5-readout" aria-live="polite">
          <p className="v5-readout-step">
            {String(state + 1).padStart(2, "0")} of 05
          </p>
          <p className="v5-readout-verdict">{readout.verdict}</p>
          <ul>
            {readout.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
