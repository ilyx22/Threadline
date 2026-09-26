"use client";

import * as React from "react";
import { C, LINE } from "@/components/marketing-v5/art/kit";

/**
 * The hero as the machine running (26 September 2026): a nine-second loop.
 * A card leaves the firm's archive on the marigold thread, passes between
 * the press rollers, comes out as a finished sheet, is pegged to the line and
 * travels to where the buyers stand; a signal returns along the lower thread
 * to the archive as the next card sets off. Drawn in the site's kit: one line
 * weight, faceless sky-blue heads, the thread as the only warm accent. The
 * motion is SMIL so it runs in every browser without script; under reduced
 * motion the static final frame is rendered instead.
 */
const DUR = "9s";
const SHEET_PATH = "M760 300 C 790 300 800 252 846 212 Q 990 246 1118 212";
const RETURN_PATH = "M1150 250 C 1150 400 1140 428 1100 428 H 330 C 295 428 288 372 288 318";
const LINE_PATH = "M800 200 Q 990 240 1180 200";

function Sheet({ x = 0, y = 0, peg = true }: { x?: number; y?: number; peg?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {peg ? <rect x={-5} y={-14} width={10} height={22} rx={3} fill={C.wood} stroke={C.ink} strokeWidth={LINE} /> : null}
      <rect x={-27} y={4} width={54} height={70} rx={4} fill={C.white} stroke={C.ink} strokeWidth={LINE} />
      <path d="M-17 22 H17 M-17 34 H10 M-17 46 H17 M-17 58 H4" stroke={C.ink} strokeWidth={1.4} opacity={0.45} strokeLinecap="round" />
    </g>
  );
}

function Buyer({ x, coat, tilt = 0 }: { x: number; coat: string; tilt?: number }) {
  return (
    <g transform={`translate(${x} 470) rotate(${tilt})`}>
      <path d="M-20 0 V-82 Q-20 -96 -6 -96 H6 Q20 -96 20 -82 V0 Z" fill={coat} stroke={C.ink} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M0 -96 V-40" stroke={C.ink} strokeWidth={1.2} opacity={0.35} />
      <ellipse cx={0} cy={-116} rx={15} ry={18} fill={C.sky} stroke={C.ink} strokeWidth={LINE} />
    </g>
  );
}

export function HeroMachine() {
  const [still, setStill] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  const anim = !still;
  return (
    <svg
      className="v9-hero-machine v5-art"
      viewBox="0 0 1280 560"
      role="img"
      aria-label="The machine running: a card leaves the firm's archive on a marigold thread, passes through a press and comes out as a finished piece, is pegged to a line and travels to where three buyers stand; a signal returns along the lower thread to the archive."
    >
      {/* ground */}
      <path d="M30 470 H1250" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />

      {/* the archive: a cabinet with three shelves of stacked cards */}
      <g>
        <rect x={70} y={150} width={210} height={320} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={LINE} />
        <rect x={84} y={164} width={182} height={292} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={LINE} />
        {[212, 300, 388].map((y) => (
          <path key={y} d={`M84 ${y} H266`} stroke={C.ink} strokeWidth={LINE} />
        ))}
        {[176, 264, 352].map((y, row) =>
          [0, 1, 2].map((i) => (
            <g key={`${row}-${i}`} transform={`translate(${98 + i * 56} ${y})`}>
              <rect x={0} y={row === 1 && i === 2 ? 30 : 0} width={44} height={row === 1 && i === 2 ? 0 : 32} rx={2} fill={C.white} stroke={C.ink} strokeWidth={row === 1 && i === 2 ? 0 : LINE} />
              {row === 1 && i === 2 ? null : <path d="M8 10 H36 M8 18 H28 M8 26 H32" stroke={C.ink} strokeWidth={1.2} opacity={0.4} strokeLinecap="round" />}
            </g>
          )),
        )}
        {/* the slot the thread leaves through, and the spool */}
        <rect x={262} y={288} width={20} height={24} rx={3} fill={C.night} />
        <g transform="translate(300 300)">
          <rect x={-10} y={-16} width={20} height={32} rx={3} fill={C.gold} stroke={C.ink} strokeWidth={LINE} />
          <path d="M-10 -8 H10 M-10 0 H10 M-10 8 H10" stroke={C.ink} strokeWidth={1} opacity={0.35} />
        </g>
      </g>

      {/* the threads: out to the press and the line, and the return underneath */}
      <path d="M310 300 H520" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M760 300 C 790 300 800 252 846 212" fill="none" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" />
      <path d={LINE_PATH} fill="none" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" />
      <path d={RETURN_PATH} fill="none" stroke={C.ink} strokeWidth={1.6} strokeDasharray="5 6" opacity={0.55} strokeLinecap="round" />

      {/* the press: two rollers between two uprights, a tray either side */}
      <g>
        <rect x={548} y={340} width={184} height={130} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={LINE} />
        <path d="M566 200 V340 M714 200 V340 M556 200 H724" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
        <rect x={500} y={296} width={60} height={10} rx={2} fill={C.woodDeep} stroke={C.ink} strokeWidth={LINE} />
        <rect x={720} y={296} width={60} height={10} rx={2} fill={C.woodDeep} stroke={C.ink} strokeWidth={LINE} />
        {[262, 338].map((cy, i) => (
          <g key={cy} transform={`translate(640 ${cy})`}>
            <circle r={36} fill={C.sky} stroke={C.ink} strokeWidth={LINE} />
            <g>
              {anim ? <animateTransform attributeName="transform" type="rotate" from="0" to={i === 0 ? "360" : "-360"} dur="3s" repeatCount="indefinite" /> : null}
              <path d="M-36 0 H36 M0 -36 V36 M-25 -25 L25 25 M-25 25 L25 -25" stroke={C.ink} strokeWidth={1.4} opacity={0.35} />
              <circle r={6} fill={C.ink} />
            </g>
          </g>
        ))}
      </g>

      {/* the line: two poles, two hung sheets, and the moving one */}
      <g>
        <path d="M800 470 V196 M1180 470 V196" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
        <circle cx={800} cy={192} r={6} fill={C.gold} stroke={C.ink} strokeWidth={LINE} />
        <circle cx={1180} cy={192} r={6} fill={C.gold} stroke={C.ink} strokeWidth={LINE} />
        <Sheet x={930} y={226} />
        <Sheet x={1030} y={224} />
      </g>

      {/* the buyers */}
      <Buyer x={1090} coat={C.lilac} />
      <Buyer x={1150} coat={C.paper} tilt={-3} />
      <Buyer x={1215} coat={C.lilac} tilt={4} />

      {/* the card leaving the archive */}
      <g opacity={anim ? 1 : 1}>
        {anim ? (
          <>
            <animateTransform attributeName="transform" type="translate" values="0 0;400 0;430 0;430 0;0 0;0 0" keyTimes="0;0.24;0.28;0.95;0.96;1" dur={DUR} repeatCount="indefinite" calcMode="linear" />
            <animate attributeName="opacity" values="1;1;0;0;0;1" keyTimes="0;0.23;0.28;0.94;0.96;1" dur={DUR} repeatCount="indefinite" />
          </>
        ) : null}
        <g transform="translate(200 300)">
          <rect x={-30} y={-22} width={60} height={44} rx={4} fill={C.white} stroke={C.ink} strokeWidth={LINE} />
          <path d="M-18 -8 H18 M-18 2 H10 M-18 12 H14" stroke={C.ink} strokeWidth={1.4} opacity={0.45} strokeLinecap="round" />
        </g>
      </g>

      {/* the finished sheet: out of the press, up to the line, along to the buyers */}
      {anim ? (
        <g opacity={0}>
          <animateMotion path={SHEET_PATH} dur={DUR} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.28;0.84;1" calcMode="linear" rotate="0" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.27;0.31;0.84;0.9;1" dur={DUR} repeatCount="indefinite" />
          <Sheet peg />
        </g>
      ) : (
        <Sheet x={846} y={212} />
      )}

      {/* the signal returning */}
      {anim ? (
        <g opacity={0}>
          <animateMotion path={RETURN_PATH} dur={DUR} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.5;0.96;1" calcMode="linear" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.5;0.53;0.94;0.97;1" dur={DUR} repeatCount="indefinite" />
          <circle r={7} fill={C.gold} stroke={C.ink} strokeWidth={LINE} />
        </g>
      ) : null}
    </svg>
  );
}
