import * as React from "react";
import { At, C, Person, SKIN, Thread, outline as O } from "./kit";

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
