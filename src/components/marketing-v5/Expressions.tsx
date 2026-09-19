"use client";

import * as React from "react";
import { expressions } from "@/content/marketing-v5";
import { ExpressionsArt } from "./art/ExpressionsArt";
import { Artefact, type ArtefactKind } from "./art/kit";

/**
 * SCENE 6 — one idea, the right expressions. Desktop: the spool-and-arc
 * illustration with a row of buttons under it; hovering or focusing a button
 * lifts that artefact and shows its one sentence. Phones: a vertical list,
 * each artefact drawn beside its label, tap to open the sentence.
 */
export default function Expressions() {
  const e = expressions;
  const kinds = e.frames.map((f) => f.kind as ArtefactKind);
  const labels = e.frames.map((f) => f.label);
  const [active, setActive] = React.useState<ArtefactKind | null>(null);
  const [pinned, setPinned] = React.useState<ArtefactKind | null>(null);
  const shown = active ?? pinned;
  const current = e.frames.find((f) => f.kind === shown) ?? null;

  return (
    <div className="v5-expr-wrap">
      <div className="v5-expr-art">
        <ExpressionsArt active={shown} kinds={kinds} labels={labels} />
      </div>
      <div className="v5-expr-why" aria-live="polite">
        {current ? (
          <p>
            <strong>{current.label}.</strong> {current.why}
          </p>
        ) : (
          <p className="is-hint">{e.hint}</p>
        )}
      </div>
      <ul className="v5-expr-list" aria-label="The expressions">
        {e.frames.map((f) => {
          const k = f.kind as ArtefactKind;
          const on = shown === k;
          return (
            <li key={f.kind}>
              <button type="button" className="v5-expr-btn" aria-pressed={pinned === k} aria-expanded={on} onMouseEnter={() => setActive(k)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(k)} onBlur={() => setActive(null)} onClick={() => setPinned((p) => (p === k ? null : k))}>
                <svg viewBox="-44 -52 88 104" className="v5-expr-thumb" aria-hidden="true">
                  <Artefact kind={k} x={0} y={0} s={0.9} />
                </svg>
                <span>{f.label}</span>
              </button>
              <p className="v5-expr-line" hidden={!on}>
                {f.why}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
