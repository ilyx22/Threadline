"use client";

import * as React from "react";
import { diagnosis } from "@/content/marketing-v5";
import { learning } from "@/content/home";

/**
 * The commercial learning loop as a ledger. Three illustrative cases; five
 * states. The ledger shows three measures with an expected mark and the
 * actual level as a thin rule, then the verdict and its lines. The first
 * state is in the HTML for readers without scripting; keyboard moves through
 * the states with arrows, Home and End.
 */
export default function Loop() {
  const d = diagnosis;
  const [caseKey, setCaseKey] = React.useState<string>(d.cases[0].key);
  const [state, setState] = React.useState(0);
  const c = d.cases.find((x) => x.key === caseKey) ?? d.cases[0];
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const values = state >= 4 ? c.after : state >= 1 ? c.actual : c.expected;
  const readout =
    state === 0
      ? { verdict: "What we expected", lines: c.gauges.map((g, i) => `${g}: about ${c.expected[i]} of 100`) }
      : state === 1
        ? { verdict: "What came back", lines: c.gauges.map((g, i) => `${g}: ${c.actual[i]} of 100`) }
        : state === 2
          ? c.why
          : state === 3
            ? { verdict: c.change.verdict, lines: [c.change.control, ...c.change.lines] }
            : c.retest;
  const go = (n: number, focus = false) => {
    const i = Math.max(0, Math.min(4, n));
    setState(i);
    if (focus) tabs.current[i]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(state + 1, true);
    else if (e.key === "ArrowLeft") go(state - 1, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(4, true);
    else return;
    e.preventDefault();
  };
  return (
    <div className="h-loop" data-state={state}>
      <div className="h-loop-cases" role="group" aria-label="Illustrative cases">
        <span className="h-label h-stamp-inline">{learning.illustrative}</span>
        {d.cases.map((x) => (
          <button
            key={x.key}
            type="button"
            className="h-chip"
            aria-pressed={x.key === caseKey}
            onClick={() => {
              setCaseKey(x.key);
              setState(0);
            }}
          >
            {x.title}
          </button>
        ))}
      </div>
      <div className="h-loop-grid">
        <div className="h-loop-tabs" role="tablist" aria-label="Loop states" onKeyDown={onKey}>
          {d.states.map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              id={`loop-tab-${i}`}
              aria-selected={i === state}
              aria-controls="loop-ledger"
              tabIndex={i === state ? 0 : -1}
              className="h-loop-tab"
              ref={(el) => {
                tabs.current[i] = el;
              }}
              onClick={() => go(i)}
            >
              <span className="h-index">0{i + 1}</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
        <div id="loop-ledger" role="tabpanel" aria-labelledby={`loop-tab-${state}`} className="h-sheet h-ledger" aria-live="polite">
          <div className="h-sheet-head">
            <span className="h-label">{c.title}</span>
            <span className="h-stamp">Illustrative</span>
          </div>
          <table className="h-ledger-table">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Expected</th>
                <th scope="col">{state >= 4 ? "Retest" : state >= 1 ? "Actual" : "—"}</th>
                <th scope="col" className="h-ledger-bar-head">
                  <span className="h-visually-hidden">Level against expectation</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {c.gauges.map((g, i) => {
                const exp = c.expected[i];
                const val = values[i];
                const short = state >= 1 && state < 4 && val < exp - 12;
                return (
                  <tr key={g} className={short ? "is-short" : undefined}>
                    <th scope="row">{g}</th>
                    <td>{exp}</td>
                    <td>{state >= 1 ? val : "—"}</td>
                    <td className="h-ledger-bar">
                      <span className="h-bar" aria-hidden="true">
                        <span className="h-bar-fill" style={{ width: `${state >= 1 ? val : exp}%` }} />
                        <span className="h-bar-mark" style={{ left: `${exp}%` }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="h-ledger-verdict">{readout.verdict}</p>
          <ul className="h-sheet-lines is-quiet">
            {readout.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="h-loop-actions">
            <button type="button" className="h-btn is-quiet is-sm" onClick={() => go(state - 1)} disabled={state === 0}>
              Back
            </button>
            <button type="button" className="h-btn is-sm" onClick={() => go(state + 1)} disabled={state === 4}>
              {state === 3 ? "Retest" : "Next"}
            </button>
          </div>
        </div>
      </div>
      <p className="h-note">{learning.note}</p>
    </div>
  );
}
