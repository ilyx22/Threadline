'use client';

import { useEffect, useRef, useState } from 'react';
import { diagnosis } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * SIGNATURE INTERACTION #4 — EXPECTED → ACTUAL → WHY → CHANGE → RETEST.
 * A small product. Three illustrative cases. The piece (a lit root thesis and
 * its five components) sits on the left; three gauges on the right.
 *   Expected  the expectation written before the piece shipped
 *   Actual    the actual bar drops in; the mismatch is hatched
 *   Why       the readout opens; the failing component tips over in vermilion;
 *             the root thesis stays lit
 *   Change    a real control: drag the lever past the midpoint to apply the
 *             one change; the component rights itself in cobalt
 *   Retest    the machine reruns; the bars move to the retest reading
 * "Run the loop" plays the five states in sequence. Keyboard: the states are
 * a tablist with arrow keys; the lever is a range input.
 */
const STEP_MS = 1500;

export default function DiagnosisSection() {
  const d = diagnosis;
  const [caseKey, setCaseKey] = useState<string>(d.cases[0].key);
  const [state, setState] = useState(0);
  const [lever, setLever] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const c = d.cases.find(x => x.key === caseKey) ?? d.cases[0];
  const applied = lever >= 60;

  // the auto-run: one state every STEP_MS, applying the change on the way
  useEffect(() => {
    if (!running) return;
    timer.current = window.setTimeout(() => {
      if (state === 3 && !applied) { setLever(100); return; }
      if (state >= 4) { setRunning(false); return; }
      setState(s => s + 1);
    }, state === 3 ? 900 : STEP_MS);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [running, state, applied]);

  const pick = (key: string) => { setRunning(false); setCaseKey(key); setState(0); setLever(0); };
  const go = (s: number) => { setRunning(false); if (s < 3) setLever(0); setState(s); };
  const run = () => { setState(0); setLever(0); setRunning(true); };

  const showActual = state >= 1;
  const showRetest = state === 4 && applied;
  const readout = (() => {
    switch (state) {
      case 0: return { verdict: 'Written down before it ships.', lines: ['Expectation recorded on a decision-support rubric, not a prediction'], tone: '' };
      case 1: return { verdict: 'Read after it has travelled.', lines: ['Actual recorded with its evidence class', 'The gap is the whole point'], tone: 'is-weak' };
      case 2: return { verdict: c.why.verdict, lines: c.why.lines, tone: 'is-weak' };
      case 3: return { verdict: c.change.verdict, lines: c.change.lines, tone: 'is-good' };
      default: return { verdict: applied ? c.retest.verdict : 'Apply the change first.', lines: applied ? c.retest.lines : ['Drag the lever in the Change state — one lever, not a rewrite'], tone: applied ? 'is-good' : 'is-weak' };
    }
  })();

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.min(4, state + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(0, state - 1)); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(4); }
  };

  return (
    <section id="diagnosis" className="section-diagnosis">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <div className="diagnosis-wrapper">
            <Reveal className="section-head diagnosis-sticky">
              <span className="eyebrow-serif">{d.eyebrow}</span>
              <h2 className="h2-64">{d.headline}</h2>
              <p className="body-lead">{d.body}</p>
              <p className="body-note">{d.note}</p>
            </Reveal>

            <Reveal className="instrument">
              <div className="instrument-top">
                <span className="label">{d.illustrative}</span>
                <div className="instrument-cases" role="group" aria-label="Illustrative cases">
                  {d.cases.map(x => (
                    <button key={x.key} type="button" className={`tab${x.key === caseKey ? ' is-active' : ''}`} aria-pressed={x.key === caseKey} onClick={() => pick(x.key)}>{x.title}</button>
                  ))}
                </div>
              </div>

              <div className="instrument-states" role="tablist" aria-label="Learning states" onKeyDown={onKey}>
                {d.states.map((s, i) => (
                  <button key={s} type="button" role="tab" id={`diag-tab-${i}`} aria-selected={state === i} aria-controls="diag-panel" tabIndex={state === i ? 0 : -1} className="tab" onClick={() => go(i)}>
                    <span className="index">{String(i + 1).padStart(2, '0')}</span>{s}
                  </button>
                ))}
              </div>

              <div className="instrument-bed" id="diag-panel" role="tabpanel" aria-labelledby={`diag-tab-${state}`} aria-live="polite">
                <div className="piece">
                  <div className={`obj piece-thesis${state >= 2 ? ' is-lit' : ''}`}>
                    <div className="thesis-band"><span className="label">Root thesis · illustrative</span></div>
                    <div className="thesis-body">{c.title}</div>
                  </div>
                  <div className="piece-parts" aria-label="Components of the piece">
                    {d.components.map(part => {
                      const failing = part === c.failing;
                      const cls = failing ? (state >= 3 && applied ? 'is-fixed' : state >= 2 ? 'is-failed' : '') : state >= 2 ? 'is-held' : '';
                      return <span key={part} className={`part ${cls}`}>{part}{failing && state >= 2 ? (applied ? ' · rewritten' : ' · failed') : ''}</span>;
                    })}
                  </div>
                  <div className={`readout${state >= 1 ? ' is-open' : ''}`}>
                    <div className="readout-inner">
                      <span className="label">{d.states[state]}</span>
                      <p className="readout-verdict">{readout.verdict}</p>
                      <div className="readout-lines">
                        {readout.lines.map(l => <div key={l} className={`readout-line ${readout.tone}`}>{l}</div>)}
                      </div>
                    </div>
                  </div>
                  {state === 3 && (
                    <div className="control">
                      <span className="control-label">{c.change.control}</span>
                      <div className="control-row">
                        <input type="range" min={0} max={100} value={lever} aria-label="Apply the one change" style={{ ['--v' as string]: `${lever}%` }} onChange={e => { setRunning(false); setLever(Number(e.target.value)); }} />
                        <span className="control-state">{applied ? 'Change applied' : 'Drag to apply'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="gauges">
                  {c.gauges.map((g, i) => {
                    const exp = c.expected[i], act = c.actual[i], ret = c.after[i];
                    const shown = showRetest ? ret : act;
                    const gapLeft = Math.min(exp, shown), gapW = Math.abs(exp - shown);
                    return (
                      <div key={g} className="gauge">
                        <span>{g}</span>
                        <div className="gauge-track">
                          <div className="gauge-expected" style={{ width: `${exp}%` }} />
                          <div className={`gauge-actual${showRetest ? ' is-retest' : ''}`} style={{ width: `${shown}%`, opacity: showActual ? 1 : 0 }} />
                          <div className={`gauge-gap${showActual && state >= 1 && state <= 2 ? ' is-on' : ''}`} style={{ left: `${gapLeft}%`, width: `${gapW}%` }} />
                        </div>
                        <span className="gauge-value">{showActual ? shown : exp}<small>{showActual ? (showRetest ? 'retest' : 'actual') : 'expected'}</small></span>
                      </div>
                    );
                  })}
                  <div className="gauge-legend"><span className="is-exp">Expected</span><span className="is-act">Actual</span><span className="is-ret">Retest</span></div>
                </div>
              </div>

              <div className="instrument-foot">
                <span className="body-note">Illustrative values on a 0–100 rubric. No client data.</span>
                <div className="instrument-step">
                  <button type="button" className="tab" onClick={() => go(Math.max(0, state - 1))} disabled={state === 0}>Back</button>
                  <button type="button" className="tab" onClick={() => go(Math.min(4, state + 1))} disabled={state === 4}>Next</button>
                  <button type="button" className={`tab${running ? '' : ' is-run'}`} onClick={running ? () => setRunning(false) : run}>{running ? 'Stop' : state === 4 ? 'Run again' : 'Run the loop'}</button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
