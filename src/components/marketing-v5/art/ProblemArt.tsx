import * as React from "react";
import { At, Binder, C, Crate, Folder, Grain, Lamp, PaperStack, Person, Plate, SKIN, Thread, outline as O } from "./kit";

/**
 * SCENE 2 — the expertise vault. A full-bleed cutaway: inside the firm, a
 * workroom overflowing with everything the firm knows (dense, warm, lit).
 * A single strand escapes through a small hatch in the wall into the outside,
 * where one buyer stands in a lot of sky with a brochure and a note that
 * says "referral". The imbalance is the argument.
 */
const CRATES = ["CLIENT CALLS", "METHOD", "PROPOSALS", "JUDGEMENT", "CASE NOTES", "PRICING LOGIC", "DELIVERY", "OBJECTIONS", "BOARD MEMOS", "OPINIONS", "POST-MORTEMS", "FRAMEWORKS"];
const TONES = [C.wood, C.butter, C.lilac, C.mint, C.coral, C.wood, C.sky, C.butter, C.lilac, C.mint, C.wood, C.coral];

/** The crowded workroom. Local box 900 × 560, floor at 560. */
export function Vault() {
  return (
    <g>
      <rect x={-60} y={-40} width={960} height={600} fill={C.navy} />
      {/* shelves, three tiers */}
      {[110, 220, 330].map((sy) => (
        <rect key={sy} x={-60} y={sy} width={700} height={12} rx={4} fill={C.wood} {...O} />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <Binder key={i} x={-40 + i * 27} y={110} h={52 + ((i * 7) % 23)} w={22} fill={[C.lilac, C.mint, C.coral, C.butter, C.sky][i % 5]} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Folder key={i} x={10 + i * 112} y={220} fill={TONES[i]} label={CRATES[i]} s={0.9} r={i % 2 ? 2 : -2} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <PaperStack key={i} x={30 + i * 150} y={330} n={4 + (i % 3)} w={60 + (i % 2) * 20} />
      ))}
      {[4, 5].map((i) => (
        <Folder key={i} x={500 + (i - 4) * 116} y={330} fill={TONES[i + 2]} label={CRATES[i + 2]} s={0.9} />
      ))}
      {/* floor crates, stacked */}
      <Crate x={70} y={560} w={130} h={72} label={CRATES[6]} fill={C.sky} />
      <Crate x={78} y={488} w={112} h={60} label={CRATES[7]} fill={C.butter} r={-2} />
      <Crate x={215} y={560} w={120} h={64} label={CRATES[8]} fill={C.lilac} />
      <Crate x={352} y={560} w={130} h={78} label={CRATES[9]} fill={C.mint} />
      <Crate x={356} y={482} w={100} h={54} label={CRATES[10]} fill={C.coral} r={3} />
      <Crate x={490} y={560} w={120} h={66} label={CRATES[11]} fill={C.wood} />
      <PaperStack x={490} y={494} n={6} w={70} />
      <Lamp x={620} y={560} />
      {/* two partners at work, unaware of the wall */}
      <Person x={720} y={556} s={0.98} shirt={C.mint} skin={SKIN[4]} hairStyle="curly" armL={[-38, -86]} armR={[26, -78]} look={-1} />
      <At x={690} y={470}>
        <rect x={-34} y={-24} width={68} height={48} rx={5} fill={C.white} {...O} strokeWidth={2.4} />
        <path d="M-22 -10 H22 M-22 0 H22 M-22 10 H6" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      </At>
      <Person x={826} y={556} s={0.98} flip shirt={C.lilac} skin={SKIN[0]} hairStyle="bob" glasses armL={[-30, -74]} armR={[30, -100]} look={-1} mood="grin" />
      <g className="v5-talk">
        <path d="M770 372 Q770 350 792 350 H830 Q852 350 852 372 Q852 394 830 394 H802 L788 406 L790 394 Q770 392 770 372 Z" fill={C.butter} {...O} strokeWidth={2.4} />
        <circle cx={796} cy={372} r={3.2} fill={C.ink} />
        <circle cx={811} cy={372} r={3.2} fill={C.ink} />
        <circle cx={826} cy={372} r={3.2} fill={C.ink} />
      </g>
      <Plate x={120} y={32} tone={C.paper}>
        INSIDE THE FIRM
      </Plate>
    </g>
  );
}

/** The outside: a lot of sky, a thin footprint, one buyer deciding. Local box 460 × 560. */
export function Outside({ tall = false }: { tall?: boolean }) {
  return (
    <g>
      {/* a small sign-board with the website and two posts pinned */}
      <rect x={60} y={300} width={150} height={190} rx={10} fill={C.paper} {...O} />
      <path d="M135 490 V560" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d="M135 490 V560" stroke={C.wood} strokeWidth={4} strokeLinecap="round" />
      <text x={135} y={334} textAnchor="middle" className="v5-label">
        A WEBSITE
      </text>
      <path d="M84 352 H186 M84 368 H170 M84 384 H150" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <rect x={84} y={402} width={46} height={58} rx={4} fill={C.white} {...O} strokeWidth={2.4} />
      <rect x={140} y={410} width={46} height={58} rx={4} fill={C.white} {...O} strokeWidth={2.4} />
      <path d="M92 418 H122 M92 428 H116 M148 426 H178 M148 436 H170" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.6} />
      <text x={135} y={482} textAnchor="middle" className="v5-label is-sm">
        TWO POSTS
      </text>
      {/* the buyer, deciding on a referral note and a deck */}
      <Person x={330} y={556} s={1.02} shirt={C.coral} skin={SKIN[1]} hairStyle="bun" armL={[-40, -100]} armR={[36, -102]} mood="flat" look={-1} />
      <At x={290} y={452} r={-8}>
        <rect x={-26} y={-18} width={52} height={36} rx={4} fill={C.butter} {...O} strokeWidth={2.4} />
        <text x={0} y={5} textAnchor="middle" className="v5-label is-sm">
          REFERRAL
        </text>
      </At>
      <At x={368} y={454} r={6}>
        <rect x={-28} y={-20} width={56} height={40} rx={4} fill={C.white} {...O} strokeWidth={2.4} />
        <text x={0} y={5} textAnchor="middle" className="v5-label is-sm">
          A DECK
        </text>
      </At>
      <text x={330} y={392} textAnchor="middle" className="v5-hand">
        ?
      </text>
      <Plate x={tall ? 300 : 300} y={tall ? 240 : 60} tone={C.white}>
        WHAT THE MARKET SEES
      </Plate>
    </g>
  );
}

export function ProblemArt({ layout = "wide" }: { layout?: "wide" | "tall" }) {
  if (layout === "tall") {
    return (
      <svg viewBox="0 0 400 1040" className="v5-art" role="img" aria-label="Inside the firm: a workroom packed with shelves, folders and crates of client calls, method, proposals, judgement and case notes, where two partners talk. A single strand escapes through a hatch. Outside: a lot of empty sky, a small sign with the website and two posts, and one buyer holding a referral note and a deck.">
        <Grain id="g-problem-t" />
        <rect x={0} y={0} width={400} height={560} fill={C.navy} />
        <g clipPath="url(#pr-tall-clip)">
          <At x={-30} y={50} s={0.6}>
            <Vault />
          </At>
        </g>
        <defs>
          <clipPath id="pr-tall-clip">
            <rect x={0} y={0} width={400} height={560} />
          </clipPath>
        </defs>
        <rect x={0} y={560} width={400} height={480} fill={C.sky} />
        <path d="M0 560 H400" stroke={C.ink} strokeWidth={4} />
        <rect x={172} y={548} width={56} height={24} rx={6} fill={C.paper} {...O} />
        <Thread draw thin d="M200 470 Q200 520 200 566 Q200 640 236 700 Q300 760 240 860" />
        <path d="M0 1010 H400" stroke={C.ink} strokeWidth={3} />
        <rect x={0} y={1010} width={400} height={30} fill={C.paper} />
        <At x={-20} y={454} s={0.98}>
          <Outside tall />
        </At>
        <rect width={400} height={1040} filter="url(#g-problem-t)" opacity={0.45} pointerEvents="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1440 620" className="v5-art" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A cutaway. Inside the firm, on the left: a workroom packed with shelves, folders and crates of client calls, method, proposals, judgement and case notes, where two partners talk. A single strand escapes through a small hatch in the wall. Outside, on the right: a lot of empty sky, a small sign with the website and two posts, and one buyer holding a referral note and a deck.">
      <Grain id="g-problem" />
      <rect x={0} y={0} width={900} height={620} fill={C.navy} />
      <rect x={900} y={0} width={540} height={620} fill={C.sky} />
      <At x={0} y={40}>
        <Vault />
      </At>
      {/* the wall and its one small hatch */}
      <path d="M900 -10 V630" stroke={C.ink} strokeWidth={10} />
      <rect x={884} y={300} width={32} height={44} rx={6} fill={C.paper} {...O} strokeWidth={3} />
      <Thread draw thin d="M760 470 Q860 420 900 322 Q960 330 1010 430 Q1040 490 1120 540" />
      <path d="M0 600 H1440" stroke={C.ink} strokeWidth={3} />
      <rect x={0} y={600} width={1440} height={20} fill={C.paper} />
      <At x={940} y={44}>
        <Outside />
      </At>
      <rect width={1440} height={620} filter="url(#g-problem)" opacity={0.45} pointerEvents="none" />
    </svg>
  );
}
