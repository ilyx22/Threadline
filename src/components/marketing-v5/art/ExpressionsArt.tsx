import * as React from "react";
import { Artefact, type ArtefactKind, C, Plate, Spool, Thread, outline as O } from "./kit";

/**
 * SCENE 6 — one spool, seven artefacts. The root thesis sits on a stand at
 * the left; seven threads leave it and each ends in a materially different
 * native object arranged on an arc. The active artefact lifts and its thread
 * brightens. Local box 1200 × 560.
 */
export const EXPR_POS: Record<ArtefactKind, [number, number]> = {
  post: [520, 110],
  video: [700, 88],
  doc: [880, 120],
  proof: [1020, 220],
  deep: [1060, 372],
  diagnostic: [920, 470],
  nurture: [720, 500],
  update: [0, 0],
};

export function ExpressionsArt({ active, kinds, labels }: { active: ArtefactKind | null; kinds: readonly ArtefactKind[]; labels: readonly string[] }) {
  const origin: [number, number] = [230, 300];
  return (
    <svg viewBox="0 0 1200 600" className="v5-art" role="img" aria-label="A spool labelled root thesis on a stand. Seven threads leave it, each ending in a different object: a written post, a phone playing a short video, a stack of document pages, a stamped proof sheet, a thick book, a clipboard diagnostic and an envelope.">
      <rect x={140} y={360} width={180} height={14} rx={5} fill={C.wood} {...O} />
      <path d="M160 374 V440 M300 374 V440" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      {kinds.map((k, i) => {
        const [x, y] = EXPR_POS[k];
        const cx = (origin[0] + x) / 2 + (i % 2 ? 40 : -20);
        const cy = (origin[1] + y) / 2 + (i < 3 ? -90 : 60);
        const on = active === k;
        return (
          <g key={k} className={`v5-expr${on ? " is-on" : ""}${active && !on ? " is-off" : ""}`}>
            <Thread thin d={`M${origin[0]} ${origin[1]} Q${cx} ${cy} ${x} ${y}`} />
            <g className="v5-expr-obj">
              <Artefact kind={k} x={x} y={y} s={1.05} r={(i - 3) * 4} />
            </g>
            <Plate x={x} y={y + 80} tone={C.white}>{labels[i].toUpperCase()}</Plate>
          </g>
        );
      })}
      <Spool x={origin[0]} y={330} s={1.3} fill={C.gold} />
      <text x={origin[0]} y={410} textAnchor="middle" className="v5-label">ROOT THESIS</text>
      <text x={origin[0]} y={432} textAnchor="middle" className="v5-label is-sm" opacity={0.7}>ILLUSTRATIVE</text>
    </svg>
  );
}
