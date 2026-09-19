import * as React from "react";
import { Artefact, At, C, Grain, Person, Plate, SKIN, Signal, Spark, Thread, outline as O } from "./kit";

/**
 * SCENE 7 — attention becoming commercially legible. A street of five
 * moments, descending left to right on a stepped pavement: many passers-by
 * glance at a pegged piece and most walk on; one buyer stops at a proof
 * window; hands over a card at a counter; sits down with the founder; the
 * founder and buyer shake hands over a signed page. Under each step, the
 * evidence stamp says how sure Threadline can be.
 */
const STEPS_X = [150, 440, 730, 1020, 1300];
const STEP_Y = [300, 340, 380, 420, 460];

function Faint({ x, y, flip, shirt }: { x: number; y: number; flip?: boolean; shirt: string }) {
  return (
    <g opacity={0.42}>
      <Person x={x} y={y} s={0.8} flip={flip} shirt={shirt} skin={SKIN[0]} hairStyle="short" armL={[-24, -60]} armR={[24, -60]} mood="flat" />
    </g>
  );
}

export function MovementArt({ layout = "wide", stamps }: { layout?: "wide" | "tall"; stamps: readonly string[] }) {
  if (layout === "tall") {
    return (
      <svg viewBox="0 0 400 1300" className="v5-art" role="img" aria-label="Five moments down a street: passers-by glance at a pegged piece and most walk on; one buyer stops at a window of proof; hands a card across a counter; sits down with the founder; and shakes hands over a signed page. Each moment carries a stamp: observed, or confirmed.">
        <Grain id="g-mv-t" />
        <Thread draw d="M60 20 V1290" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <At x={240} y={200 + i * 250} s={0.62}>
              <Moment i={i} />
            </At>
            <At x={60} y={200 + i * 250 - 60}>
              <rect x={-14} y={-14} width={28} height={28} rx={8} fill={i > 2 ? C.gold : C.white} {...O} />
            </At>
            <text x={96} y={200 + i * 250 - 54} className="v5-label is-sm">{stamps[i].toUpperCase()}</text>
          </g>
        ))}
        <rect width={400} height={1300} filter="url(#g-mv-t)" opacity={0.4} pointerEvents="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1440 620" className="v5-art" role="img" aria-label="Five moments down a stepped street, left to right: passers-by glance at a pegged piece and most walk on; one buyer stops at a window of proof; hands a card across a counter; sits down with the founder; and shakes hands over a signed page. Under each step a stamp says observed or confirmed.">
      <Grain id="g-mv" />
      {/* the stepped pavement */}
      {STEP_Y.map((y, i) => (
        <rect key={i} x={i === 0 ? -20 : STEPS_X[i] - 150} y={y} width={i === 4 ? 340 : 300} height={620 - y} fill={i % 2 ? C.paper : C.paperDeep} stroke={C.ink} strokeWidth={3} />
      ))}
      <Thread draw d="M-20 240 Q200 250 300 280 Q500 330 600 340 Q800 360 900 380 Q1100 400 1180 420 Q1300 440 1460 452" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <At x={STEPS_X[i]} y={STEP_Y[i]} s={0.96}>
            <Moment i={i} />
          </At>
          <g transform={`translate(${STEPS_X[i]} ${STEP_Y[i] + 60})`}>
            <rect x={-64} y={-15} width={128} height={30} rx={8} fill={i > 2 ? C.gold : C.white} {...O} strokeWidth={2.4} />
            <text x={0} y={5} textAnchor="middle" className="v5-label is-sm">{stamps[i].toUpperCase()}</text>
          </g>
        </g>
      ))}
      <rect width={1440} height={620} filter="url(#g-mv)" opacity={0.4} pointerEvents="none" />
    </svg>
  );
}

/** One moment, origin at the pavement under the people. */
function Moment({ i }: { i: number }) {
  const buyer = { shirt: C.coral, skin: SKIN[3], hairStyle: "bob" as const };
  const founder = { shirt: C.paper, skin: SKIN[2], hairStyle: "curly" as const };
  return (
    <g>
      {i === 0 && (
        <g>
          <path d="M-130 -190 V-2 M130 -190 V-2" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          <Thread d="M-130 -190 Q0 -130 130 -190" />
          <Artefact kind="post" x={0} y={-100} s={0.8} />
          <Faint x={-90} y={-2} shirt={C.sky} />
          <Faint x={90} y={-2} flip shirt={C.lilac} />
          <Person x={0} y={-2} {...buyer} armL={[-26, -70]} armR={[22, -140]} look={0} mood="oh" />
          <Spark x={40} y={-176} s={0.8} />
        </g>
      )}
      {i === 1 && (
        <g>
          <rect x={-120} y={-230} width={150} height={190} rx={12} fill={C.paper} {...O} />
          <text x={-45} y={-200} textAnchor="middle" className="v5-label is-sm">PROOF</text>
          <Artefact kind="proof" x={-78} y={-120} s={0.7} r={-3} />
          <Artefact kind="doc" x={-14} y={-120} s={0.7} r={4} />
          <Person x={70} y={-2} {...buyer} flip armL={[-24, -76]} armR={[38, -122]} look={1} />
        </g>
      )}
      {i === 2 && (
        <g>
          <rect x={-40} y={-110} width={190} height={14} rx={5} fill={C.wood} {...O} />
          <path d="M-20 -96 V0 M130 -96 V0" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <Person x={-70} y={-2} {...buyer} armL={[-24, -70]} armR={[42, -118]} look={1} mood="smile" />
          <Person x={120} y={-2} {...founder} flip armL={[-26, -72]} armR={[46, -118]} look={1} />
          <At x={30} y={-124} r={-6}>
            <rect x={-24} y={-14} width={48} height={28} rx={4} fill={C.white} {...O} strokeWidth={2.4} />
            <path d="M-14 -4 H14 M-14 4 H4" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
          </At>
        </g>
      )}
      {i === 3 && (
        <g>
          <rect x={-60} y={-90} width={120} height={12} rx={5} fill={C.wood} {...O} />
          <path d="M0 -78 V-8" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          <Person x={-76} y={-2} {...buyer} sit armL={[-16, -100]} armR={[36, -108]} look={1} mood="grin" />
          <Person x={80} y={-2} {...founder} flip sit armL={[-18, -100]} armR={[34, -110]} look={1} mood="grin" />
          <g className="v5-talk">
            <circle cx={-14} cy={-150} r={4} fill={C.ink} />
            <circle cx={0} cy={-150} r={4} fill={C.ink} />
            <circle cx={14} cy={-150} r={4} fill={C.ink} />
          </g>
        </g>
      )}
      {i === 4 && (
        <g>
          <Person x={-52} y={-2} {...buyer} armL={[-26, -70]} armR={[34, -100]} look={1} mood="grin" />
          <Person x={52} y={-2} {...founder} flip armL={[-24, -70]} armR={[34, -100]} look={1} mood="grin" />
          <At x={0} y={-176} r={-4}>
            <rect x={-30} y={-22} width={60} height={44} rx={5} fill={C.white} {...O} strokeWidth={2.4} />
            <path d="M-18 -8 H18 M-18 2 H10" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
            <path d="M-12 12 q6 -8 12 0 t12 0" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
          </At>
          <Signal x={0} y={-236} label="RECORDED" s={0.8} />
        </g>
      )}
    </g>
  );
}

export { Plate as MovementPlate };
