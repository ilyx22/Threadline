import * as React from "react";
import { C, Knot, Pegged, Plate, Spool, Thread, outline as O } from "@/components/marketing-v5/art/kit";

/**
 * One idea, the right expressions: the root spool on the left, a line strung
 * to the right with four pegged expressions, a knot where each was tied in.
 * Local box 1200 × 360. The names of the four forms live in the HTML under it.
 */
export function ExpressionsArt() {
  return (
    <svg viewBox="0 0 1200 360" className="v5-art" role="img" aria-label="A spool labelled root idea on the left. A thread runs from it to a line strung between two poles, where a written post, a short video, a working document and a conversation brief hang from pegs, a knot at each.">
      <path d="M0 330 H1200" stroke={C.ink} strokeWidth={2} />
      <Spool x={120} y={300} s={1.25} />
      <Plate x={120} y={214} tone={C.white}>
        ROOT IDEA
      </Plate>
      <Thread draw d="M150 270 Q220 250 300 190 Q360 150 420 120" />
      <path d="M420 330 V120" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M420 330 V120" stroke={C.wood} strokeWidth={3} strokeLinecap="round" />
      <circle cx={420} cy={120} r={6} fill={C.gold} {...O} />
      <path d="M1140 330 V110" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M1140 330 V110" stroke={C.wood} strokeWidth={3} strokeLinecap="round" />
      <circle cx={1140} cy={110} r={6} fill={C.gold} {...O} />
      <Thread draw d="M420 120 Q780 220 1140 110" />
      <Pegged kind="post" x={560} y={155} r={5} s={1.05} />
      <Pegged kind="video" x={730} y={178} r={2} s={1.05} />
      <Pegged kind="doc" x={900} y={172} r={-3} s={1.05} />
      <Pegged kind="nurture" x={1060} y={135} r={-6} s={1.05} />
      {[520, 690, 860, 1020].map((kx, i) => (
        <Knot key={kx} x={kx} y={[148, 172, 172, 142][i]} s={0.9} />
      ))}
    </svg>
  );
}
