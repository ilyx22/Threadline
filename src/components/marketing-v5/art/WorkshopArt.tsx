import * as React from "react";
import { Artefact, At, C, Gear, Grain, LINE, Person, Plate, Signal, Spool, Thread, outline as O } from "./kit";

/**
 * SCENE 5 — the Authority Workshop, one panorama, six stations. The root
 * object travels the bench from left to right and is changed at every
 * station: loose fragments → a wound spool → three native cuts → dispatched
 * parcels → a tray of labelled signals → the same spool with one part
 * replaced. `station` (0–5) sets which carrier state is shown; the stage
 * component moves it. Local box 1800 × 640, bench top at y=430.
 */
export const STATION_X = [150, 450, 750, 1050, 1350, 1650];
export const WORKSHOP_W = 1800;

function Bench() {
  return (
    <g>
      <rect x={20} y={430} width={1760} height={22} rx={2} fill={C.wood} {...O} />
      {[80, 380, 680, 980, 1280, 1580, 1740].map((x) => (
        <path key={x} d={`M${x} 452 V600`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d="M20 600 H1780" stroke={C.ink} strokeWidth={LINE} />
    </g>
  );
}

/** Station 1: the intelligence table — bins of what buyers ask, a lens on an arm. */
function Intel() {
  return (
    <g>
      <rect x={20} y={318} width={230} height={9} rx={1} fill={C.wood} {...O} />
      <rect x={30} y={250} width={100} height={68} rx={2} fill={C.sky} {...O} />
      <rect x={140} y={258} width={100} height={60} rx={2} fill={C.paperDeep} {...O} />
      <text x={80} y={288} textAnchor="middle" className="v5-label is-xs">
        QUESTIONS
      </text>
      <text x={190} y={292} textAnchor="middle" className="v5-label is-xs">
        OBJECTIONS
      </text>
      <path d="M270 430 V240 Q270 202 222 202" fill="none" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={210} cy={202} r={26} fill={C.sky} {...O} strokeWidth={2.4} />
      <circle cx={210} cy={202} r={14} fill={C.white} opacity={0.6} />
      <Person x={100} y={598} s={0.95} shirt={C.lilac} apron={C.gold} armL={[-30, -110]} armR={[34, -132]} />
    </g>
  );
}

/** Station 2: the binding press — fragments wound into one spool. */
function Binding() {
  return (
    <g>
      <rect x={380} y={230} width={140} height={200} rx={3} fill={C.lilac} {...O} />
      <rect x={404} y={252} width={92} height={26} rx={2} fill={C.lilacDeep} {...O} />
      <circle cx={450} cy={330} r={30} fill={C.paper} {...O} />
      <path d="M450 306 V354 M426 330 H474" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <circle cx={450} cy={330} r={4} fill={C.ink} />
      <Gear x={528} y={262} r={24} fill={C.paperDeep} />
      <Person x={560} y={598} s={0.95} flip shirt={C.sky} apron={C.gold} armL={[-26, -120]} armR={[30, -128]} />
    </g>
  );
}

/** Station 3: the cutting loom — one thread, three native shapes. */
function Loom() {
  return (
    <g>
      <path d="M680 430 V250 H820 V430" fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M680 250 V222 M820 250 V222" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {[700, 720, 740, 760, 780, 800].map((x) => (
        <path key={x} d={`M${x} 258 V424`} stroke={C.gold} strokeWidth={1.8} />
      ))}
      <rect x={686} y={318} width={128} height={12} rx={2} fill={C.paperDeep} {...O} />
      <Person x={860} y={598} s={0.95} shirt={C.paperDeep} apron={C.gold} armL={[-30, -118]} armR={[26, -108]} />
    </g>
  );
}

/** Station 4: dispatch — the hatch to the two rooms the buyer is in. */
function Dispatch() {
  return (
    <g>
      <rect x={960} y={180} width={180} height={250} rx={3} fill={C.paperDeep} {...O} />
      <rect x={984} y={208} width={132} height={80} rx={2} fill={C.navy} {...O} />
      <text x={1050} y={252} textAnchor="middle" className="v5-label is-paper">
        TO THE BUYER
      </text>
      <rect x={984} y={304} width={54} height={60} rx={2} fill={C.paper} {...O} />
      <rect x={1062} y={304} width={54} height={60} rx={2} fill={C.paper} {...O} />
      <text x={1011} y={338} textAnchor="middle" className="v5-label is-xs">
        ROOM 1
      </text>
      <text x={1089} y={338} textAnchor="middle" className="v5-label is-xs">
        ROOM 2
      </text>
      <Person x={1170} y={598} s={0.95} flip shirt={C.lilac} apron={C.gold} armL={[-28, -112]} armR={[34, -122]} />
    </g>
  );
}

/** Station 5: the signal tray — what came back, with its evidence class. */
function SignalTray() {
  return (
    <g>
      <path d="M1250 430 V330 Q1250 300 1280 300 H1440" fill="none" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M1250 430 V330 Q1250 300 1280 300 H1440" fill="none" stroke={C.gold} strokeWidth={1.4} strokeLinecap="round" />
      <rect x={1250} y={382} width={230} height={48} rx={2} fill={C.sky} {...O} />
      {["OBSERVED", "INFERRED", "CONFIRMED"].map((l, i) => (
        <g key={l} transform={`translate(${1290 + i * 74} 406)`}>
          <rect x={-33} y={-12} width={66} height={24} rx={2} fill={[C.white, C.paperDeep, C.gold][i]} {...O} />
          <text x={0} y={3.5} textAnchor="middle" className="v5-label is-xs" textLength={54} lengthAdjust="spacingAndGlyphs">
            {l}
          </text>
        </g>
      ))}
      <Person x={1460} y={598} s={0.95} shirt={C.sky} apron={C.gold} armL={[-32, -112]} armR={[26, -120]} />
    </g>
  );
}

/** Station 6: the test bench — expected against actual, one part swapped. */
function TestBench() {
  return (
    <g>
      <rect x={1540} y={330} width={240} height={9} rx={1} fill={C.wood} {...O} />
      <rect x={1560} y={262} width={200} height={68} rx={2} fill={C.sky} {...O} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${1590 + i * 60} 296)`}>
          <rect x={-18} y={-26} width={36} height={52} rx={2} fill={C.white} {...O} />
          <rect x={-14} y={[-6, 14, -14][i]} width={28} height={[30, 10, 38][i]} rx={1} fill={[C.mintDeep, C.coralDeep, C.mintDeep][i]} />
          <path d="M-22 -12 H22" stroke={C.ink} strokeWidth={1.4} strokeDasharray="3 3" />
        </g>
      ))}
      <path d="M1700 430 V270 Q1700 240 1730 240 H1760" fill="none" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M1730 240 v22 q0 10 10 10 h10" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
      <Person x={1560} y={598} s={0.95} flip shirt={C.lilac} apron={C.gold} armL={[-30, -118]} armR={[30, -126]} />
      <circle cx={1518} cy={462} r={14} fill={C.sky} {...O} strokeWidth={2.2} />
      <path d="M1528 472 l12 12" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

/** The travelling root object, one state per station. Rendered at the carrier's origin (bench top). */
function Carrier({ state }: { state: number }) {
  return (
    <g>
      {state === 0 && (
        <g>
          {[[-40, -30, C.white, -6], [-6, -38, C.paperDeep, 5], [26, -26, C.white, -3], [-24, -60, C.sky, 8], [14, -66, C.white, -10]].map(([x, y, tone, r], i) => (
            <At key={i} x={x as number} y={y as number} r={r as number}>
              <rect x={-20} y={-13} width={40} height={26} rx={1} fill={tone as string} {...O} />
              <path d="M-12 -4 H12 M-12 4 H6" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
            </At>
          ))}
        </g>
      )}
      {state === 1 && (
        <g>
          <Spool x={0} y={-30} s={0.9} />
          <Plate x={0} y={-86}>ROOT THESIS</Plate>
        </g>
      )}
      {state === 2 && (
        <g>
          <Artefact kind="post" x={-70} y={-50} s={0.72} r={-6} />
          <Artefact kind="video" x={0} y={-56} s={0.72} />
          <Artefact kind="doc" x={70} y={-50} s={0.72} r={6} />
        </g>
      )}
      {state === 3 && (
        <g>
          {[-40, 6, 52].map((x, i) => (
            <At key={x} x={x} y={-34} r={i % 2 ? 3 : -3}>
              <rect x={-26} y={-30} width={52} height={60} rx={2} fill={C.wood} {...O} />
              <path d="M-26 -10 H26 M0 -30 V30" stroke={C.ink} strokeWidth={1.4} opacity={0.5} />
              <circle cx={12} cy={-18} r={5} fill={C.gold} {...O} />
            </At>
          ))}
        </g>
      )}
      {state === 4 && (
        <g>
          <Signal x={-50} y={-42} label="REPLY" s={0.85} />
          <Signal x={44} y={-30} label="VISIT" s={0.85} />
          <Signal x={0} y={-72} label="ASKED" s={0.85} />
        </g>
      )}
      {state === 5 && (
        <g>
          <Spool x={0} y={-30} s={0.9} />
          <Plate x={0} y={-86}>ROOT THESIS · V2</Plate>
          <rect x={-44} y={-64} width={18} height={34} rx={1} fill={C.mint} {...O} className="v5-newpart" />
        </g>
      )}
    </g>
  );
}

export function WorkshopArt({ station = 0, interactive = true }: { station?: number; interactive?: boolean }) {
  return (
    <svg viewBox="0 90 1800 550" className="v5-art v5-workshop-art" role="img" aria-label="One long workbench with six stations, left to right: the intelligence table with bins of buyer questions and objections; the binding press that winds fragments into one spool; the loom that cuts the thread into a post, a video and a document; the dispatch hatch to the two rooms the buyer is in; the signal tray where replies come back labelled observed, inferred or confirmed; and the test bench where expected is read against actual and one part is replaced. Operators work at every station. The thread runs the length of the bench.">
      <Grain id="g-ws" />
      <rect x={0} y={0} width={1800} height={640} fill={C.night} />
      <Thread draw d="M0 300 Q120 310 250 300 Q380 292 450 330 Q540 350 700 340 Q900 330 1050 330 Q1200 330 1250 330 Q1400 330 1500 300 Q1650 280 1800 300" />
      <Bench />
      <Intel />
      <Binding />
      <Loom />
      <Dispatch />
      <SignalTray />
      <TestBench />
      {/* station plates */}
      {["01 · LISTEN", "02 · DECIDE THE IDEA", "03 · MAKE IT", "04 · PUT IT IN THE ROOM", "05 · READ WHAT CAME BACK", "06 · CHANGE ONE THING"].map((t, i) => (
        <g key={t} className={interactive ? (station === i ? "v5-station is-on" : "v5-station") : "v5-station is-on"}>
          <Plate x={STATION_X[i]} y={150} tone={C.paper}>
            {t}
          </Plate>
        </g>
      ))}
      {/* the carrier */}
      <g className="v5-carrier" style={{ ["--sx" as string]: `${STATION_X[station]}px` }}>
        <g transform="translate(0 430)">
          <rect x={-70} y={0} width={140} height={12} rx={1} fill={C.wood} {...O} />
          <circle cx={-46} cy={18} r={8} fill={C.paper} {...O} />
          <circle cx={46} cy={18} r={8} fill={C.paper} {...O} />
          <Carrier state={station} />
        </g>
      </g>
      {/* the return: learning feeds the next round */}
      <Thread thin dashed d="M1700 560 Q900 640 120 560" />
      <rect width={1800} height={640} filter="url(#g-ws)" opacity={0.35} pointerEvents="none" />
    </svg>
  );
}

/** One station on its own, for the workshop mosaic: the bench, the station's machine, its plate and the root object as it is at that station. Cropped windows along the panorama. */
const WINDOWS: [number, number][] = [
  [0, 330],
  [340, 320],
  [640, 300],
  [920, 300],
  [1220, 300],
  [1490, 310],
];
const STATION_PARTS = [Intel, Binding, Loom, Dispatch, SignalTray, TestBench];
const STATION_NAMES = ["01 · LISTEN", "02 · DECIDE THE IDEA", "03 · MAKE IT", "04 · PUT IT IN THE ROOM", "05 · READ WHAT CAME BACK", "06 · CHANGE ONE THING"];
export function StationScene({ i, label }: { i: number; label?: string }) {
  const [x0, w] = WINDOWS[i];
  const Part = STATION_PARTS[i];
  return (
    <svg viewBox={`${x0} 168 ${w} 302`} className="v5-art v5-station-scene" preserveAspectRatio="xMidYMax meet" role="img" aria-label={label ?? STATION_NAMES[i]}>
      <Thread d="M0 300 Q120 310 250 300 Q380 292 450 330 Q540 350 700 340 Q900 330 1050 330 Q1200 330 1250 330 Q1400 330 1500 300 Q1650 280 1800 300" />
      <Bench />
      <Part />
      <g transform={`translate(${STATION_X[i]} 430)`}>
        <rect x={-70} y={0} width={140} height={12} rx={1} fill={C.wood} {...O} />
        <circle cx={-46} cy={18} r={8} fill={C.paper} {...O} />
        <circle cx={46} cy={18} r={8} fill={C.paper} {...O} />
        <Carrier state={i} />
      </g>
    </svg>
  );
}
