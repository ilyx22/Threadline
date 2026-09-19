import * as React from "react";
import { Armchair, At, Binder, C, Crate, Folder, Gear, Grain, Knot, Lamp, PaperStack, Pegged, Person, Plate, SKIN, Signal, Spark, Spool, Thread, outline as O } from "./kit";

/**
 * SCENE 1 — the opening illustration. Private expertise on the left, inside the
 * firm's archive; the Threadline is drawn off a spool, through the workshop
 * press, and out over the market as a line of pegged, native artefacts that
 * the right buyers look up and meet. One reply is already travelling back.
 * Readable with every animation switched off.
 */

/** The firm's private archive: shelves, crates, a founder talking, an operator drawing the thread. Local box 520 × 400, floor at y=400. */
export function Archive({ calm = false, tidy = false }: { calm?: boolean; tidy?: boolean }) {
  return (
    <g>
      <path d="M-40 28 H456 Q500 28 500 72 V400 H-40 Z" fill={C.navy} {...O} />
      {/* back wall panelling */}
      <path d="M-40 236 H500" stroke={C.navySoft} strokeWidth={3} />
      {/* shelves */}
      <rect x={-40} y={128} width={330} height={11} rx={4} fill={C.wood} {...O} />
      <rect x={-40} y={222} width={290} height={11} rx={4} fill={C.wood} {...O} />
      {[
        [8, C.lilac, 72],
        [32, C.mint, 64],
        [56, C.coral, 76],
        [80, C.butter, 60],
        [104, C.lilac, 70],
        [128, C.sky, 78],
        [152, C.mint, 62],
        [190, C.coral, 70],
        [214, C.butter, 74],
        [238, C.lilac, 58],
      ].map(([bx, tone, h]) => (
        <Binder key={bx as number} x={bx as number} y={128} h={h as number} fill={tone as string} />
      ))}
      <Folder x={44} y={222} fill={C.mint} label="CALLS" s={0.8} r={tidy ? 0 : -4} />
      <Folder x={140} y={222} fill={C.coral} label="NOTES" s={0.8} r={tidy ? 0 : 3} />
      <PaperStack x={222} y={222} n={5} w={56} />
      {/* floor: what the firm knows */}
      <Crate x={46} y={400} w={124} h={70} label="METHOD" fill={C.wood} />
      <Crate x={62} y={330} w={110} h={58} label="JUDGEMENT" fill={C.butter} r={tidy ? 0 : -3} />
      <Crate x={176} y={400} w={118} h={60} label="PROPOSALS" fill={C.lilac} />
      <PaperStack x={176} y={340} n={4} w={74} />
      {/* the founder, talking */}
      <Armchair x={298} y={400} fill={C.coral} s={0.95} />
      <Person x={290} y={384} s={0.95} sit shirt={C.paper} legs={C.navySoft} skin={SKIN[1]} hairStyle="side" armL={[-28, -70]} armR={[44, -118]} mood="grin" look={1} />
      {!calm ? (
        <g className="v5-talk">
          <path d="M352 226 Q352 200 380 200 H418 Q446 200 446 226 Q446 252 418 252 H386 L366 266 L370 252 Q352 250 352 226 Z" fill={C.butter} {...O} strokeWidth={2.4} />
          <circle cx={382} cy={226} r={3.5} fill={C.ink} />
          <circle cx={399} cy={226} r={3.5} fill={C.ink} />
          <circle cx={416} cy={226} r={3.5} fill={C.ink} />
        </g>
      ) : null}
      <Lamp x={232} y={400} s={0.9} />
      {/* the porthole to the outside */}
      <circle cx={500} cy={262} r={30} fill={C.sky} {...O} strokeWidth={4} />
      <Plate x={392} y={96} tone={C.paper}>
        INSIDE THE FIRM
      </Plate>
    </g>
  );
}

/** The workshop press: the thread goes in raw and comes out ready. Local box 260 × 330, floor at y=330, nip at y=186. */
export function Press() {
  return (
    <g>
      <rect x={16} y={240} width={228} height={90} rx={14} fill={C.mint} {...O} />
      <rect x={40} y={262} width={84} height={44} rx={8} fill={C.paper} {...O} />
      <path d="M52 278 H112 M52 290 H98" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <circle cx={170} cy={284} r={13} fill={C.coral} {...O} />
      <circle cx={210} cy={284} r={13} fill={C.butter} {...O} />
      <rect x={36} y={70} width={22} height={172} rx={6} fill={C.lilac} {...O} />
      <rect x={202} y={70} width={22} height={172} rx={6} fill={C.lilac} {...O} />
      <rect x={24} y={44} width={212} height={34} rx={10} fill={C.lilacDeep} {...O} />
      <Gear x={226} y={112} r={30} fill={C.butter} />
      <g>
        <circle cx={130} cy={150} r={34} fill={C.paper} {...O} />
        <circle cx={130} cy={222} r={34} fill={C.paper} {...O} />
        <g className="v5-spin is-slow">
          <path d="M130 124 V176 M104 150 H156" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
        <g className="v5-spin is-slow is-rev">
          <path d="M130 196 V248 M104 222 H156" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function Pole({ x, top, base }: { x: number; top: number; base: number }) {
  return (
    <g>
      <path d={`M${x} ${base} V${top}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
      <path d={`M${x} ${base} V${top}`} stroke={C.wood} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={top} r={9} fill={C.coral} {...O} />
    </g>
  );
}

export function HeroArt({ layout = "wide", evolved = false }: { layout?: "wide" | "tall"; evolved?: boolean }) {
  if (layout === "tall") {
    return (
      <svg viewBox="0 0 400 800" className="v5-art" role="img" aria-label="Inside the firm, a founder talks among shelves and crates of expertise. A thread is drawn from a spool, through the Threadline press, and out as a line of pegged posts, videos and documents that buyers look up at. A reply travels back.">
        <Grain id="g-hero-t" />
        <rect x={0} y={744} width={400} height={56} fill={C.paper} />
        <path d="M0 744 H400" stroke={C.ink} strokeWidth={3} />
        <At x={10} y={0} s={0.74}>
          <Archive />
        </At>
        <Spool x={330} y={262} s={0.72} />
        <At x={226} y={300} s={0.62}>
          <Press />
        </At>
        <Thread draw d="M336 250 Q396 258 392 336 Q390 414 350 415 H270 Q200 416 120 450 Q42 476 38 500" />
        <Pole x={38} top={500} base={744} />
        <Pole x={372} top={492} base={744} />
        <Thread draw d="M38 500 Q205 620 372 492" />
        <Pegged kind="post" x={104} y={538} r={5} s={0.74} sway />
        <Pegged kind="video" x={205} y={558} s={0.74} sway />
        <Pegged kind="doc" x={306} y={536} r={-5} s={0.74} sway />
        <Person x={92} y={744} s={0.62} shirt={C.lilac} skin={SKIN[2]} hairStyle="curly" armR={[26, -150]} look={1} mood="grin" />
        <Person x={210} y={744} s={0.62} shirt={C.mint} skin={SKIN[0]} hairStyle="bob" glasses armL={[-24, -80]} armR={[22, -84]} look={0} />
        <Person x={318} y={744} s={0.62} flip shirt={C.butter} skin={SKIN[3]} hairStyle="short" armR={[28, -96]} look={1} />
        <Spark x={210} y={632} s={0.8} />
        <Plate x={200} y={774} tone={C.white}>
          THE PEOPLE WHO MATTER
        </Plate>
        <rect width={400} height={800} filter="url(#g-hero-t)" opacity={0.5} pointerEvents="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1440 540" className="v5-art" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Inside the firm, a founder talks among shelves and crates of expertise while a Threadline operator draws a thread from a spool. The thread runs through the workshop press and out over the market as a line of pegged posts, videos, documents and proof that a few buyers look up at and recognise. A reply travels back along the line.">
      <Grain id="g-hero" />
      {/* ground */}
      <rect x={0} y={482} width={1440} height={58} fill={C.paper} />
      <path d="M0 482 H1440" stroke={C.ink} strokeWidth={3} />
      <At x={0} y={82}>
        <Archive tidy={evolved} />
      </At>
      {/* the spool and the operator who draws the line */}
      <Spool x={404} y={434} s={0.9} />
      <Person x={452} y={478} s={0.92} shirt={C.sky} apron={C.gold} skin={SKIN[3]} hairStyle="bun" armL={[-30, -92]} armR={[34, -120]} look={1} />
      <At x={590} y={152}>
        <Press />
      </At>
      <Plate x={720} y={180} tone={C.white}>
        THREADLINE
      </Plate>
      {/* the thread: spool → porthole → press → up to the line */}
      <Thread draw d="M430 402 Q470 340 500 344 Q560 348 640 338 H800 Q850 338 868 96" />
      <Pole x={868} top={96} base={482} />
      <Pole x={1408} top={86} base={482} />
      <Thread draw d="M868 96 Q1138 262 1408 86" />
      <Pegged kind="post" x={976} y={149} r={6} sway />
      <Pegged kind="video" x={1084} y={172} r={2} sway />
      <Pegged kind="doc" x={1192} y={171} r={-2} sway />
      <Pegged kind="proof" x={1300} y={143} r={-6} sway />
      {evolved ? <Pegged kind="deep" x={930} y={128} r={8} s={0.8} sway /> : null}
      {evolved ? <Pegged kind="diagnostic" x={1360} y={118} r={-8} s={0.8} sway /> : null}
      {evolved ? [960, 1030, 1140, 1250, 1340].map((kx, i) => <Knot key={kx} x={kx} y={[150, 172, 176, 160, 128][i]} s={0.8} />) : null}
      {/* the people who matter */}
      <Person x={940} y={478} s={0.9} shirt={C.lilac} skin={SKIN[2]} hairStyle="curly" armL={[-26, -70]} armR={[24, -158]} look={1} mood="grin" />
      <Person x={1080} y={478} s={0.9} shirt={C.mint} skin={SKIN[0]} hairStyle="bob" glasses armL={[-22, -84]} armR={[20, -88]} />
      <At x={1080} y={388}>
        <rect x={-13} y={-20} width={26} height={40} rx={5} fill={C.navy} {...O} strokeWidth={2.4} />
      </At>
      <Person x={1216} y={478} s={0.9} flip shirt={C.butter} skin={SKIN[4]} hairStyle="short" armL={[-30, -64]} armR={[30, -104]} look={1} />
      <Person x={1340} y={478} s={0.9} flip shirt={C.coral} skin={SKIN[1]} hairStyle="side" armL={[-28, -66]} armR={[26, -70]} look={1} mood={evolved ? "grin" : "flat"} />
      <Spark x={1080} y={300} />
      <Spark x={940} y={286} s={0.7} />
      {evolved ? <Spark x={1340} y={304} s={0.8} /> : null}
      {/* a reply, travelling back */}
      <Thread thin dashed d="M1150 452 Q960 530 790 420" />
      <g className="v5-return">
        <Signal x={968} y={487} label="REPLY" />
      </g>
      {evolved ? (
        <g className="v5-return is-late">
          <Signal x={1060} y={468} label="ENQUIRY" />
        </g>
      ) : null}
      <Plate x={1180} y={512} tone={C.white}>
        THE PEOPLE WHO MATTER
      </Plate>
      <rect width={1440} height={540} filter="url(#g-hero)" opacity={0.5} pointerEvents="none" />
    </svg>
  );
}
