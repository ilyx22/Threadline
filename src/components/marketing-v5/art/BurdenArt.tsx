import * as React from "react";
import { Armchair, At, C, Gear, Grain, Lamp, Person, Plate, SKIN, Spool, Thread, Artefact, outline as O } from "./kit";

/**
 * SCENE 4 — calm founder, busy machine. Left: the founder in an armchair
 * with a coffee, a small microphone on a stand and a stamp on the side
 * table: the four things only they do. Right, behind a window: the workshop
 * at full tilt — operators, a conveyor, gears, a spool being wound.
 */
export function CalmFounder() {
  return (
    <svg viewBox="0 0 520 420" className="v5-art" role="img" aria-label="The founder sits calmly in an armchair with a coffee. Beside them: a microphone on a stand, a camera on a tripod, a stamp, and a phone. Everything they need to do fits on one side table.">
      <Grain id="g-calm" />
      <rect x={0} y={370} width={520} height={50} fill={C.paper} />
      <path d="M0 370 H520" stroke={C.ink} strokeWidth={3} />
      <Armchair x={260} y={370} fill={C.mint} s={1.15} />
      <Person x={250} y={352} s={1.15} sit shirt={C.paper} legs={C.navySoft} skin={SKIN[2]} hairStyle="curly" armL={[-30, -80]} armR={[46, -92]} look={0} mood="smile" />
      <At x={306} y={246}>
        <path d="M-12 0 H12 V16 Q12 24 4 24 H-4 Q-12 24 -12 16 Z" fill={C.white} {...O} strokeWidth={2.4} />
        <path d="M12 6 q10 0 10 8 q0 8 -10 8" fill="none" stroke={C.ink} strokeWidth={2.4} />
      </At>
      {/* side table with the four tools */}
      <rect x={40} y={288} width={150} height={12} rx={5} fill={C.wood} {...O} />
      <path d="M60 300 V370 M170 300 V370" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      {/* microphone: talk */}
      <path d="M78 288 V236" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <rect x={66} y={196} width={24} height={44} rx={12} fill={C.coral} {...O} />
      <path d="M70 212 H86 M70 222 H86" stroke={C.ink} strokeWidth={2} />
      {/* small camera: record, when it adds trust */}
      <rect x={104} y={252} width={40} height={30} rx={6} fill={C.navy} {...O} />
      <circle cx={124} cy={267} r={9} fill={C.sky} {...O} strokeWidth={2.4} />
      <rect x={112} y={244} width={14} height={8} rx={2} fill={C.navy} {...O} strokeWidth={2} />
      {/* stamp: approve */}
      <rect x={152} y={266} width={30} height={16} rx={4} fill={C.gold} {...O} strokeWidth={2.4} />
      <rect x={162} y={248} width={10} height={20} rx={3} fill={C.wood} {...O} strokeWidth={2.4} />
      {/* phone: sell */}
      <rect x={406} y={296} width={24} height={40} rx={5} fill={C.navy} {...O} strokeWidth={2.4} />
      <Lamp x={452} y={370} flip />
      <Plate x={120} y={166} tone={C.white}>
        WHAT YOU DO
      </Plate>
      <rect width={520} height={420} filter="url(#g-calm)" opacity={0.4} pointerEvents="none" />
    </svg>
  );
}

export function BusyMachine({ labels }: { labels: readonly string[] }) {
  return (
    <svg viewBox="0 0 760 420" className="v5-art" role="img" aria-label="Behind a window, the Threadline workshop at full tilt: operators at a conveyor sorting research, scripts and packaging, gears turning, a spool being wound, artefacts leaving through a dispatch hatch.">
      <Grain id="g-busy" />
      <rect x={0} y={0} width={760} height={420} fill={C.night} />
      {/* wall labels: the eight jobs */}
      {labels.map((l, i) => (
        <text key={l} x={30 + (i % 4) * 180} y={40 + Math.floor(i / 4) * 26} className="v5-label is-paper" opacity={0.7}>
          {l.toUpperCase()}
        </text>
      ))}
      {/* conveyor */}
      <rect x={40} y={292} width={560} height={26} rx={13} fill={C.navySoft} {...O} />
      <g className="v5-belt">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={70 + i * 84} cy={305} r={7} fill={C.paper} />
        ))}
      </g>
      <g className="v5-conveyed">
        <Artefact kind="post" x={110} y={258} s={0.5} r={-4} />
        <Artefact kind="video" x={250} y={256} s={0.5} r={3} />
        <Artefact kind="doc" x={390} y={258} s={0.5} r={-2} />
        <Artefact kind="proof" x={530} y={256} s={0.5} r={4} />
      </g>
      <Gear x={660} y={120} r={44} fill={C.lilac} />
      <Gear x={712} y={186} r={30} fill={C.mint} className="v5-spin is-rev" />
      <Gear x={632} y={200} r={26} fill={C.butter} className="v5-spin is-rev" />
      {/* the winder */}
      <Spool x={680} y={330} s={0.9} />
      <Thread d="M600 306 Q640 296 660 316" thin />
      {/* operators */}
      <Person x={150} y={396} s={0.92} shirt={C.sky} apron={C.gold} skin={SKIN[3]} hairStyle="bun" armL={[-34, -112]} armR={[30, -118]} look={1} />
      <Person x={330} y={396} s={0.92} shirt={C.coral} apron={C.gold} skin={SKIN[0]} hairStyle="short" armL={[-28, -116]} armR={[26, -110]} look={-1} mood="grin" />
      <Person x={500} y={396} s={0.92} shirt={C.mint} apron={C.gold} skin={SKIN[4]} hairStyle="curly" armL={[-30, -110]} armR={[38, -124]} look={1} />
      {/* dispatch hatch */}
      <rect x={606} y={236} width={130} height={40} rx={8} fill={C.paper} {...O} />
      <text x={671} y={261} textAnchor="middle" className="v5-label is-sm">
        DISPATCH
      </text>
      <Plate x={120} y={110} tone={C.paper}>
        WHAT THREADLINE DOES
      </Plate>
      <rect width={760} height={420} filter="url(#g-busy)" opacity={0.35} pointerEvents="none" />
    </svg>
  );
}
