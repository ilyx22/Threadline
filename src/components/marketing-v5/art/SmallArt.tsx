import * as React from "react";
import { At, C, Knot, Person, Plate, SKIN, Thread, outline as O } from "./kit";

/**
 * SCENE 9 — the twelve-week loom. Left: many loose threads, tangled and
 * frayed. Middle: threads being cut or doubled. Right: a few strong strands
 * woven into a band. One continuous drawing.
 */
export function CycleArt() {
  const loose = Array.from({ length: 12 }).map((_, i) => {
    const y = 60 + i * 30;
    const wob = (i % 3) * 18 - 18;
    return `M0 ${y} Q120 ${y + wob} 240 ${y - wob} T480 ${y}`;
  });
  return (
    <svg viewBox="0 0 1440 440" className="v5-art" role="img" aria-label="Twelve loose, frayed threads on the left are gathered in the middle, where an operator cuts the weak ones and doubles the strong ones, and become a few thick woven strands on the right.">
      <g opacity={0.9}>
        {loose.map((d, i) => (
          <Thread key={i} thin d={d} className={i % 4 === 3 ? "is-frayed" : ""} />
        ))}
      </g>
      {/* the gather: a ring */}
      <circle cx={560} cy={230} r={40} fill={C.lilac} {...O} strokeWidth={4} />
      <circle cx={560} cy={230} r={18} fill={C.paper} {...O} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <Thread key={i} thin d={`M480 ${60 + i * 30} Q520 ${60 + i * 30} 560 230`} />
      ))}
      {/* cut ends fall */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${600 + i * 30} 300 q6 20 -4 40`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={0.45} />
      ))}
      <Person x={660} y={400} s={0.95} shirt={C.coral} apron={C.gold} skin={SKIN[4]} hairStyle="curly" armL={[-40, -120]} armR={[-10, -150]} look={-1} />
      <path d="M622 262 l-10 -14 M622 262 l-14 10" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {/* the strong strands, doubling */}
      {[0, 1, 2].map((i) => (
        <Thread key={i} d={`M560 230 Q700 ${150 + i * 80} 860 ${190 + i * 40} T1150 ${200 + i * 30}`} />
      ))}
      {/* the woven band */}
      <rect x={1130} y={150} width={310} height={160} rx={16} fill={C.butter} {...O} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M1130 ${170 + i * 20} H1440`} stroke={C.gold} strokeWidth={6} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <path key={i} d={`M${1150 + i * 30} 150 V310`} stroke={C.ink} strokeWidth={5} opacity={0.55} strokeDasharray="14 6" />
      ))}
      {[0, 1, 2].map((i) => (
        <Knot key={i} x={1150 + i * 110} y={210 + i * 20} />
      ))}
      <Plate x={180} y={30} tone={C.white}>MANY HYPOTHESES</Plate>
      <Plate x={660} y={100} tone={C.white}>CUT, OR DOUBLED</Plate>
      <Plate x={1285} y={110} tone={C.white}>VALIDATED PATTERNS</Plate>
    </svg>
  );
}

/**
 * SCENE 11 — the gate. A garden gate with a small brass plate. The strong-fit
 * traits stand in a line on the left, going through; the poor-fit ones are
 * turned away kindly on the right. The lists are typographic; the gate is
 * the object.
 */
export function GateArt() {
  return (
    <svg viewBox="0 110 420 310" className="v5-art" role="img" aria-label="A garden gate in a low wall. A Threadline operator holds it open for a founder walking through; another founder, turned away kindly, is pointed to a different path.">
      <rect x={0} y={330} width={420} height={90} fill={C.paper} />
      <path d="M0 330 H420" stroke={C.ink} strokeWidth={3} />
      {/* the wall */}
      <rect x={0} y={220} width={110} height={110} fill={C.lilac} {...O} />
      <rect x={310} y={220} width={110} height={110} fill={C.lilac} {...O} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M0 ${250 + i * 26} H110 M310 ${250 + i * 26} H420`} stroke={C.ink} strokeWidth={2} opacity={0.35} />
      ))}
      {/* the gate, open */}
      <path d="M110 330 V200 M310 330 V200" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <circle cx={110} cy={196} r={9} fill={C.gold} {...O} />
      <circle cx={310} cy={196} r={9} fill={C.gold} {...O} />
      <At x={112} y={210}>
        <path d="M0 0 L0 116 L86 140 L86 30 Z" fill={C.mint} {...O} />
        {[14, 30, 46, 62, 78].map((x) => (
          <path key={x} d={`M${x} ${x * 0.28 + 4} V${116 + x * 0.28}`} stroke={C.ink} strokeWidth={3} />
        ))}
      </At>
      <rect x={168} y={140} width={84} height={30} rx={6} fill={C.gold} {...O} />
      <text x={210} y={160} textAnchor="middle" className="v5-label is-sm">THE FIT</text>
      <Thread d="M-10 300 Q100 260 210 300 Q320 340 430 300" />
      <Person x={230} y={328} s={0.9} shirt={C.sky} apron={C.gold} skin={SKIN[3]} hairStyle="bun" armL={[-34, -100]} armR={[36, -112]} look={-1} />
      <Person x={60} y={328} s={0.9} shirt={C.coral} skin={SKIN[2]} hairStyle="curly" armL={[-28, -70]} armR={[30, -70]} look={1} mood="grin" />
      <Person x={380} y={328} s={0.9} flip shirt={C.butter} skin={SKIN[0]} hairStyle="side" armL={[-26, -70]} armR={[30, -104]} look={-1} mood="flat" />
    </svg>
  );
}

/** A small operator waving from the corner of the comparison device. */
export function TinyOperator() {
  return (
    <svg viewBox="0 0 120 180" className="v5-art" aria-hidden="true">
      <Person x={60} y={176} s={0.95} shirt={C.mint} apron={C.gold} skin={SKIN[1]} hairStyle="bob" armL={[-30, -70]} armR={[40, -140]} look={-1} mood="grin" />
    </svg>
  );
}
