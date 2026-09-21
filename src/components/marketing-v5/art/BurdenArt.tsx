import * as React from "react";
import { Armchair, At, C, Gear, Grain, Lamp, LINE, Person, Plate, Spool, Thread, Artefact, outline as O } from "./kit";

/**
 * SCENE 4 — calm founder, busy machine. Left: the founder in an armchair
 * with a coffee, a small microphone on a stand and a stamp on the side
 * table: the four things only they do. Right, behind a window: the workshop
 * at work — operators, a conveyor, gears, a spool being wound.
 */
export function CalmFounder() {
  return (
    <svg viewBox="0 0 520 420" className="v5-art" role="img" aria-label="The founder sits calmly in an armchair with a coffee. Beside them: a microphone on a stand, a camera on a tripod, a stamp, and a phone. Everything they need to do fits on one side table.">
      <Grain id="g-calm" />
      <rect x={0} y={370} width={520} height={50} fill={C.paper} />
      <path d="M0 370 H520" stroke={C.ink} strokeWidth={LINE} />
      <Armchair x={260} y={370} fill={C.lilac} s={1.15} />
      <Person x={250} y={352} s={1.15} sit shirt={C.paper} armL={[-30, -80]} armR={[46, -92]} />
      <At x={306} y={246}>
        <path d="M-12 0 H12 V16 Q12 22 6 22 H-6 Q-12 22 -12 16 Z" fill={C.white} {...O} />
        <path d="M12 6 q9 0 9 7 q0 7 -9 7" fill="none" stroke={C.ink} strokeWidth={LINE} />
      </At>
      {/* side table with the four tools */}
      <rect x={40} y={288} width={150} height={10} rx={1} fill={C.wood} {...O} />
      <path d="M60 298 V370 M170 298 V370" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      {/* microphone: talk */}
      <path d="M78 288 V236" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={67} y={196} width={22} height={42} rx={11} fill={C.navy} {...O} />
      <path d="M71 210 H85 M71 218 H85" stroke={C.paper} strokeWidth={1.2} opacity={0.6} />
      {/* small camera: record, when it adds trust */}
      <rect x={104} y={252} width={40} height={30} rx={2} fill={C.navy} {...O} />
      <circle cx={124} cy={267} r={8} fill={C.sky} {...O} />
      <rect x={112} y={245} width={14} height={7} rx={1} fill={C.navy} {...O} />
      {/* stamp: approve */}
      <rect x={152} y={268} width={30} height={14} rx={1} fill={C.gold} {...O} />
      <rect x={162} y={250} width={10} height={18} rx={1} fill={C.wood} {...O} />
      {/* phone: sell */}
      <rect x={406} y={298} width={22} height={38} rx={2} fill={C.navy} {...O} />
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
    <svg viewBox="0 0 760 420" className="v5-art" role="img" aria-label="Behind a window, the Threadline workshop at work: operators at a conveyor sorting research, scripts and packaging, gears, a spool being wound, artefacts leaving through a dispatch hatch.">
      <Grain id="g-busy" />
      <rect x={0} y={0} width={760} height={420} fill={C.night} />
      {/* wall labels: the eight jobs */}
      {labels.map((l, i) => (
        <text key={l} x={30 + (i % 4) * 180} y={40 + Math.floor(i / 4) * 24} className="v5-label is-paper" opacity={0.65}>
          {l.toUpperCase()}
        </text>
      ))}
      {/* conveyor */}
      <rect x={40} y={292} width={560} height={24} rx={3} fill={C.navySoft} {...O} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={70 + i * 84} cy={304} r={6} fill={C.paper} {...O} />
      ))}
      <g className="v5-conveyed">
        <Artefact kind="post" x={110} y={258} s={0.5} r={-3} />
        <Artefact kind="video" x={250} y={256} s={0.5} r={2} />
        <Artefact kind="doc" x={390} y={258} s={0.5} r={-2} />
        <Artefact kind="proof" x={530} y={256} s={0.5} r={3} />
      </g>
      <Gear x={660} y={120} r={44} fill={C.lilac} />
      <Gear x={712} y={186} r={30} fill={C.sky} />
      <Gear x={632} y={200} r={26} fill={C.paperDeep} />
      {/* the winder */}
      <Spool x={680} y={330} s={0.9} />
      <Thread d="M600 304 Q640 296 656 316" thin />
      {/* operators */}
      <Person x={150} y={396} s={0.92} shirt={C.sky} apron={C.gold} armL={[-34, -112]} armR={[30, -118]} />
      <Person x={330} y={396} s={0.92} shirt={C.lilac} apron={C.gold} armL={[-28, -116]} armR={[26, -110]} />
      <Person x={500} y={396} s={0.92} shirt={C.paperDeep} apron={C.gold} armL={[-30, -110]} armR={[38, -124]} />
      {/* dispatch hatch */}
      <rect x={606} y={238} width={130} height={36} rx={2} fill={C.paper} {...O} />
      <text x={671} y={260} textAnchor="middle" className="v5-label is-sm">
        DISPATCH
      </text>
      <Plate x={120} y={110} tone={C.paper}>
        WHAT THREADLINE DOES
      </Plate>
      <rect width={760} height={420} filter="url(#g-busy)" opacity={0.35} pointerEvents="none" />
    </svg>
  );
}
