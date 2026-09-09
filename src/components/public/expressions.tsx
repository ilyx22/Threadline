"use client";

import * as React from "react";
import { ContentTile, ThesisCard, type TileKind } from "@/components/factory/objects";

/**
 * ONE IDEA. THE RIGHT EXPRESSIONS. One root thesis becomes native expressions
 * that visibly differ. Rendered expanded on the server so it reads without
 * JavaScript; the button replays the multiplication. Nothing implies every
 * platform every time — the caveat is part of the component.
 */
export function Expressions({ thesis, outputs, action, reset, caveat }: { thesis: { label: string; text: string }; outputs: readonly { kind: string; label: string; excerpt: string }[]; action: string; reset: string; caveat: string }) {
  const [state, setState] = React.useState<"one" | "many">("many");
  const timer = React.useRef<number | null>(null);
  const replay = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setState("one");
    timer.current = window.setTimeout(() => setState("many"), 350);
  };
  React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return (
    <div className="tl-multiply" data-state={state}>
      <div className="tl-multiply-root">
        <ThesisCard title={thesis.text} label={thesis.label} lines={0}>
          <p className="mx-[0.9rem] mt-3 text-[13px] leading-relaxed text-[color:var(--ink-faint)]">Illustrative content, not a claim about a client.</p>
        </ThesisCard>
        <div className="tl-multiply-actions">
          <button type="button" className="tl-btn tl-btn-primary tl-btn-sm" onClick={replay} aria-controls="expressions-outputs">
            {state === "many" ? `${action} again` : action}
            <span aria-hidden>→</span>
          </button>
          <button type="button" className="tl-btn tl-btn-sm" onClick={() => setState((s) => (s === "many" ? "one" : "many"))} aria-pressed={state === "one"}>
            {state === "many" ? reset : "Show the expressions"}
          </button>
        </div>
        <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-[color:var(--ink-faint)]">{caveat}</p>
      </div>
      <div id="expressions-outputs" className="tl-multiply-outputs" aria-live="polite">
        {outputs.map((o) => (
          <ContentTile key={o.label} kind={o.kind as TileKind} label={o.label} excerpt={o.excerpt} />
        ))}
      </div>
    </div>
  );
}
