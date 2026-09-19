import * as React from "react";
import { Archive, Press } from "./HeroArt";
import { At, C, Grain, Pegged, Person, Plate, SKIN, Spool, Thread, outline as O } from "./kit";

/**
 * Phase D — two alternative hero compositions built on the same message, kept
 * in the design lab beside the chosen one (HeroArt, "the pegged line"). They
 * differ in composition, not colour.
 *
 * B — "the cutaway": a tall drawing. The archive is underground; the thread
 *     rises through a hatch into the sky, where the artefacts hang from a
 *     mast beside the buyers. Copy sits to the left.
 * C — "the line through the words": the headline is the scene. The thread is
 *     drawn through the lines of type and three buyers stand on the baseline
 *     of the last line, reading what hangs from it.
 */
export function HeroCutaway() {
  return (
    <svg viewBox="0 0 640 820" className="v5-art" role="img" aria-label="A cutaway: the firm's archive underground, a thread rising through a hatch into the daylight where posts, a video and a document hang from a mast beside three buyers.">
      <Grain id="g-cut" />
      <rect x={0} y={0} width={640} height={470} fill={C.sky} />
      <rect x={0} y={470} width={640} height={350} fill={C.navy} />
      <rect x={0} y={456} width={640} height={16} fill={C.paper} />
      <path d="M0 456 H640 M0 472 H640" stroke={C.ink} strokeWidth={3} />
      <At x={60} y={430} s={0.78}>
        <Archive calm />
      </At>
      <Spool x={470} y={730} s={0.9} />
      <rect x={520} y={446} width={40} height={30} rx={6} fill={C.paper} {...O} />
      <Thread draw d="M496 700 Q560 640 540 520 Q536 470 540 400 Q544 250 480 200" />
      <path d="M480 456 V200" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
      <path d="M480 456 V200" stroke={C.wood} strokeWidth={5} strokeLinecap="round" />
      <path d="M300 208 H600" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <Thread draw d="M300 210 Q450 300 600 210" />
      <Pegged kind="post" x={360} y={240} r={6} s={0.8} sway />
      <Pegged kind="video" x={450} y={256} s={0.8} sway />
      <Pegged kind="doc" x={540} y={240} r={-6} s={0.8} sway />
      <Person x={120} y={452} s={0.82} shirt={C.lilac} skin={SKIN[2]} hairStyle="curly" armR={[30, -150]} look={1} mood="grin" />
      <Person x={230} y={452} s={0.82} shirt={C.mint} skin={SKIN[0]} hairStyle="bob" glasses armL={[-22, -84]} armR={[20, -88]} look={1} />
      <Person x={600} y={452} s={0.82} flip shirt={C.butter} skin={SKIN[3]} hairStyle="short" armR={[28, -96]} look={1} />
      <Plate x={150} y={60} tone={C.white}>
        WHAT THE MARKET SEES
      </Plate>
      <rect width={640} height={820} filter="url(#g-cut)" opacity={0.45} pointerEvents="none" />
    </svg>
  );
}

export function HeroTypographic({ headline }: { headline: string }) {
  const words = headline.split(" ");
  return (
    <div className="v5-hero-typo">
      <svg viewBox="0 0 1200 160" className="v5-art v5-hero-typo-line" aria-hidden="true">
        <Thread draw d="M-10 120 Q200 40 400 110 T800 100 T1210 60" />
        <Pegged kind="post" x={300} y={78} r={5} s={0.7} />
        <Pegged kind="video" x={700} y={102} s={0.7} />
        <Pegged kind="doc" x={1000} y={78} r={-5} s={0.7} />
      </svg>
      <h1 className="v5-h1 is-typo" style={{ maxWidth: "none" }}>
        {words.map((w, i) => (
          <span key={i} className={i === 1 || i === 7 ? "is-lift" : undefined}>
            {w}{" "}
          </span>
        ))}
      </h1>
      <svg viewBox="0 0 1200 200" className="v5-art" aria-hidden="true">
        <path d="M0 190 H1200" stroke={C.ink} strokeWidth={3} />
        <At x={880} y={0}>
          <Press />
        </At>
        <Spool x={820} y={170} s={0.7} />
        <Person x={140} y={186} s={0.9} shirt={C.lilac} skin={SKIN[2]} hairStyle="curly" armR={[30, -150]} look={1} mood="grin" />
        <Person x={260} y={186} s={0.9} shirt={C.mint} skin={SKIN[0]} hairStyle="bob" glasses armL={[-22, -84]} armR={[20, -88]} />
        <Person x={1100} y={186} s={0.9} flip shirt={C.butter} skin={SKIN[3]} hairStyle="short" armR={[28, -96]} look={1} />
      </svg>
    </div>
  );
}
