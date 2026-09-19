import * as React from "react";
import { Artefact, At, C, Knot, Person, SKIN, Spark, Thread, outline as O } from "./kit";

/**
 * SCENE 3 — market memory as a frieze. One identifiable buyer (lilac coat,
 * bun, glasses) five times, left to right, in five ordinary moments. The
 * thread runs behind the whole strip; every useful encounter ties a knot and
 * the knots accumulate. No counter, no funnel.
 */
const BUYER = { shirt: C.lilac, skin: SKIN[1], hairStyle: "bun" as const, glasses: true };

function Moment({ i, x, y, s = 1 }: { i: number; x: number; y: number; s?: number }) {
  return (
    <At x={x} y={y} s={s}>
      {i === 0 && (
        <g>
          {/* on the train, thumbing past a company update */}
          <rect x={-120} y={-150} width={240} height={150} rx={20} fill={C.sky} {...O} />
          <rect x={-100} y={-128} width={70} height={56} rx={8} fill={C.white} {...O} strokeWidth={2.4} />
          <rect x={20} y={-128} width={70} height={56} rx={8} fill={C.white} {...O} strokeWidth={2.4} />
          <Person x={-10} y={-2} {...BUYER} armL={[-22, -72]} armR={[18, -74]} look={0} mood="flat" />
          <Artefact kind="update" x={4} y={-86} s={0.42} />
        </g>
      )}
      {i === 1 && (
        <g>
          {/* at a desk, a useful post lands */}
          <rect x={-110} y={-70} width={220} height={14} rx={5} fill={C.wood} {...O} />
          <path d="M-90 -56 V0 M90 -56 V0" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <rect x={-40} y={-140} width={80} height={62} rx={6} fill={C.navy} {...O} />
          <rect x={-32} y={-132} width={64} height={46} rx={4} fill={C.white} {...O} strokeWidth={2} />
          <Artefact kind="post" x={0} y={-109} s={0.42} />
          <Person x={-4} y={-2} {...BUYER} sit armL={[-16, -90]} armR={[26, -96]} look={0} mood="oh" />
          <Spark x={44} y={-166} s={0.8} />
        </g>
      )}
      {i === 2 && (
        <g>
          {/* coffee with a colleague, quoting the judgement */}
          <ellipse cx={0} cy={-2} rx={120} ry={14} fill={C.mint} {...O} strokeWidth={2.4} />
          <Person x={-56} y={-2} {...BUYER} armL={[-24, -70]} armR={[30, -104]} look={1} mood="grin" />
          <Person x={62} y={-2} flip shirt={C.butter} skin={SKIN[2]} hairStyle="short" armL={[-22, -70]} armR={[30, -92]} look={1} />
          <path d="M-24 -196 Q-24 -216 -2 -216 H30 Q52 -216 52 -196 Q52 -176 30 -176 H8 L-6 -166 L-4 -176 Q-24 -176 -24 -196 Z" fill={C.white} {...O} strokeWidth={2.4} />
          <Artefact kind="video" x={14} y={-196} s={0.3} />
        </g>
      )}
      {i === 3 && (
        <g>
          {/* in a meeting, a proof asset answers the question */}
          <rect x={-130} y={-82} width={260} height={14} rx={5} fill={C.wood} {...O} />
          <path d="M-110 -68 V0 M110 -68 V0" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <Person x={-60} y={-2} {...BUYER} sit armL={[-16, -96]} armR={[34, -104]} look={1} />
          <Person x={70} y={-2} flip sit shirt={C.coral} skin={SKIN[3]} hairStyle="side" armL={[-18, -96]} armR={[26, -100]} look={1} mood="oh" />
          <Artefact kind="proof" x={4} y={-122} s={0.62} r={-4} />
        </g>
      )}
      {i === 4 && (
        <g>
          {/* the problem arrives; she picks up the phone */}
          <rect x={-120} y={-150} width={240} height={150} rx={20} fill={C.butter} {...O} />
          <Person x={0} y={-2} {...BUYER} armL={[-26, -76]} armR={[22, -128]} look={1} mood="grin" />
          <At x={26} y={-142}>
            <rect x={-10} y={-18} width={20} height={36} rx={5} fill={C.navy} {...O} strokeWidth={2.4} />
          </At>
          <path d="M44 -170 q8 -8 16 0 M50 -182 q14 -12 28 -2" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
    </At>
  );
}

const LABELS = ["STRANGER", "RECOGNISE", "REMEMBER", "TRUST", "CONVERSATION"];

export function MemoryArt({ layout = "wide" }: { layout?: "wide" | "tall" }) {
  if (layout === "tall") {
    const ys = [190, 430, 670, 910, 1150];
    return (
      <svg viewBox="0 0 400 1240" className="v5-art" role="img" aria-label="The same buyer, five times: scrolling past a company update on the train; a useful post landing at her desk; quoting the judgement behind it over coffee; a proof asset answering her question in a meeting; picking up the phone when the problem arrives. A thread runs beside her and ties a knot at every useful encounter.">
        <Thread draw d="M40 20 V1230" />
        {ys.map((y, i) => (
          <g key={i}>
            <Moment i={i} x={230} y={y} s={0.68} />
            {i > 0 ? <Knot x={40} y={y - 60} /> : null}
            <text x={70} y={y + 34} className="v5-label">
              {String(i + 1).padStart(2, "0")} · {LABELS[i]}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  const xs = [150, 440, 730, 1020, 1300];
  return (
    <svg viewBox="0 100 1440 320" className="v5-art" role="img" aria-label="The same buyer, five times, left to right: scrolling past a company update on the train; a useful post landing at her desk; quoting the judgement behind it over coffee; a proof asset answering her question in a meeting; picking up the phone when the problem arrives. A thread runs behind the strip and ties a knot at every useful encounter.">
      <path d="M0 340 H1440" stroke={C.ink} strokeWidth={3} />
      <Thread draw d="M-10 372 Q300 372 440 372 T880 372 T1450 372" />
      {xs.map((x, i) => (
        <g key={i}>
          <Moment i={i} x={x} y={340} s={0.9} />
          {i > 0 ? <Knot x={x - 120} y={372} /> : null}
          <text x={x} y={404} textAnchor="middle" className="v5-label">
            {String(i + 1).padStart(2, "0")} · {LABELS[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
