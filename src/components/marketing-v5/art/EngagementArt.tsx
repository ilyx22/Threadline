import * as React from "react";
import { Artefact, At, C, Knot, Plate, Signal, Spool, Thread, outline as O } from "./kit";

/**
 * SCENE 3 — the engagement, drawn as one sheet. The thread runs down the
 * left margin and ties a knot at each step: the spool (the root idea), three
 * artefacts (the outputs), two rooms (distribution), four signals (what came
 * back), and the bench verdict (the decision). Every figure on it is
 * invented and the sheet says so. Local box 420 × 1040.
 */
const STEP_Y = [120, 320, 520, 720, 920];

export function EngagementArt({ steps }: { steps: readonly string[] }) {
  return (
    <svg viewBox="0 0 420 1040" className="v5-art" role="img" aria-label="An engagement sheet. A thread runs down the margin and ties a knot at each of five steps: a spool labelled root idea; a written post, a short video and a document; two rooms marked with a measured link; four signal tokens labelled visits, replies, request and enquiry; and a small bench where a coral block is swapped for a mint one. A stamp reads illustrative.">
      <rect x={6} y={6} width={408} height={1028} rx={14} fill={C.white} {...O} strokeWidth={2.5} />
      <Thread draw d="M60 20 V1020" />
      {STEP_Y.map((y, i) => (
        <g key={i}>
          <Knot x={60} y={y} />
          <text x={92} y={y - 62} className="v5-label is-sm">{String(i + 1).padStart(2, "0")} · {steps[i].toUpperCase()}</text>
        </g>
      ))}
      {/* 01 the root idea */}
      <Spool x={200} y={110} s={0.95} label="ROOT IDEA" />
      <At x={300} y={82} r={4}>
        <rect x={-46} y={-30} width={92} height={60} rx={5} fill={C.butter} {...O} strokeWidth={2.4} />
        <path d="M-32 -14 H32 M-32 -2 H32 M-32 10 H12" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
      </At>
      {/* 02 the outputs */}
      <Artefact kind="post" x={150} y={310} s={0.9} r={-6} />
      <Artefact kind="video" x={240} y={316} s={0.9} />
      <Artefact kind="doc" x={332} y={310} s={0.9} r={6} />
      {/* 03 the rooms */}
      <rect x={112} y={470} width={120} height={90} rx={10} fill={C.sky} {...O} />
      <rect x={252} y={470} width={120} height={90} rx={10} fill={C.lilac} {...O} />
      <text x={172} y={522} textAnchor="middle" className="v5-label is-sm">ROOM 1</text>
      <text x={312} y={522} textAnchor="middle" className="v5-label is-sm">ROOM 2</text>
      <Thread thin d="M172 560 Q172 590 242 590 Q312 590 312 560" />
      <Plate x={242} y={590} tone={C.white}>MEASURED LINK</Plate>
      {/* 04 what came back */}
      <Signal x={150} y={700} label="14 VISITS" s={0.8} />
      <Signal x={300} y={700} label="2 REPLIES" s={0.8} />
      <Signal x={160} y={748} label="1 REQUEST" s={0.8} />
      <Signal x={312} y={748} label="1 ENQUIRY" s={0.8} />
      <text x={242} y={792} textAnchor="middle" className="v5-label is-xs" opacity={0.75}>OBSERVED · INFERRED · CONFIRMED</text>
      {/* 05 the decision: the bench, one block swapped */}
      <rect x={112} y={930} width={270} height={12} rx={5} fill={C.wood} {...O} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${140 + i * 54} 930)`}>
          <rect x={-22} y={-34} width={44} height={34} rx={5} fill={i === 1 ? C.mintDeep : C.paper} {...O} strokeWidth={2.4} />
        </g>
      ))}
      <At x={330} y={878} r={14}>
        <rect x={-22} y={-17} width={44} height={34} rx={5} fill={C.coral} {...O} strokeWidth={2.4} />
      </At>
      <path d="M232 878 Q270 850 306 870" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="5 4" />
      <path d="M306 870 l-10 -1 M306 870 l-3 -9" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
      <At x={330} y={1000} r={-8}>
        <rect x={-58} y={-16} width={116} height={32} rx={6} fill="none" stroke={C.coralDeep} strokeWidth={3} />
        <text x={0} y={5} textAnchor="middle" className="v5-label" style={{ fill: "var(--v5-coral-deep)" }}>ILLUSTRATIVE</text>
      </At>
    </svg>
  );
}
