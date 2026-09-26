import * as React from "react";

/**
 * The hero loop (26 September 2026): an overlay drawn in the hero picture's
 * own coordinates (1262 by 468), so the picture itself is untouched. Every
 * eight seconds a marigold pulse runs along the thread from the archive shelf
 * to the wall, reappears at the press and runs up to the line, lights the
 * four pegs in turn, and a signal returns along the ground to the archive.
 * SMIL, so it needs no script; hidden under reduced motion and on phones,
 * where the picture is cropped.
 */
const DUR = "8s";
const ARCHIVE = "M272 86 C 296 140 322 230 412 296";
const PRESS = "M664 300 C 704 302 744 262 772 170 Q 990 212 1200 150";
const RETURN = "M1196 168 C 1204 320 1184 440 1120 446 H 440";
const PEGS: readonly [number, number, string][] = [
  [858, 170, "0.34"],
  [947, 165, "0.4"],
  [1030, 168, "0.46"],
  [1122, 165, "0.52"],
];

export function HeroLoop() {
  return (
    <svg className="v9-hero-loop" viewBox="0 0 1262 468" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        {/* a soft trail behind the pulse, then the pulse itself */}
        {[
          [ARCHIVE, "0", "0.18"],
          [PRESS, "0.18", "0.52"],
        ].map(([d, from, to]) => (
          <React.Fragment key={d}>
            <path d={d} pathLength={100} stroke="#F2A51F" strokeWidth={9} strokeOpacity={0.22} strokeDasharray="14 100" strokeDashoffset={14}>
              <animate attributeName="stroke-dashoffset" values="14;14;-100;-100" keyTimes={`0;${from};${to};1`} dur={DUR} repeatCount="indefinite" calcMode="linear" />
            </path>
            <path d={d} pathLength={100} stroke="#F2A51F" strokeWidth={3.5} strokeDasharray="7 100" strokeDashoffset={7}>
              <animate attributeName="stroke-dashoffset" values="7;7;-100;-100" keyTimes={`0;${from};${to};1`} dur={DUR} repeatCount="indefinite" calcMode="linear" />
            </path>
          </React.Fragment>
        ))}
      </g>
      {/* the four pegs light as the pulse passes */}
      {PEGS.map(([x, y, at]) => (
        <circle key={x} cx={x} cy={y} r={7} fill="#F2A51F" stroke="#17233a" strokeWidth={1.6} opacity={0}>
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${at};${(+at + 0.02).toFixed(2)};${(+at + 0.16).toFixed(2)};${(+at + 0.24).toFixed(2)};1`} dur={DUR} repeatCount="indefinite" />
          <animate attributeName="r" values="7;7;10;7;7;7" keyTimes={`0;${at};${(+at + 0.02).toFixed(2)};${(+at + 0.06).toFixed(2)};${(+at + 0.24).toFixed(2)};1`} dur={DUR} repeatCount="indefinite" />
        </circle>
      ))}
      {/* the signal returning along the ground */}
      <g opacity={0}>
        <animateMotion path={RETURN} dur={DUR} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.56;0.94;1" calcMode="linear" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.56;0.59;0.92;0.96;1" dur={DUR} repeatCount="indefinite" />
        <circle r={7} fill="#F2A51F" stroke="#17233a" strokeWidth={1.6} />
      </g>
    </svg>
  );
}
