import * as React from "react";
import { Armchair, At, Binder, C, Crate, Folder, Gear, Grain, Knot, Lamp, LINE, PaperStack, Pegged, Person, Plate, Signal, Spool, Thread, outline as O } from "./kit";

/**
 * SCENE 1: the opening illustration. Private expertise on the left, inside the
 * firm's archive; the Threadline is drawn off a spool, through the workshop
 * press, and out over the market as a line of pegged, native artefacts that
 * the right buyers look up and meet. One reply is already travelling back.
 * Readable with every animation switched off.
 */

const BINDERS = [C.paper, C.sky, C.paperDeep, C.lilac, C.paper, C.sky, C.paperDeep, C.paper, C.lilac, C.sky] as const;

/** The firm's private archive: shelves, crates, a founder at work. Local box 520 × 400, floor at y=400. */
export function Archive({ tidy = false }: { tidy?: boolean }) {
  return (
    <g>
      <path d="M-40 28 H470 Q500 28 500 58 V400 H-40 Z" fill={C.navy} {...O} />
      <path d="M-40 236 H500" stroke={C.navySoft} strokeWidth={LINE} />
      {/* shelves */}
      <rect x={-40} y={128} width={330} height={9} rx={1} fill={C.wood} {...O} />
      <rect x={-40} y={222} width={290} height={9} rx={1} fill={C.wood} {...O} />
      {[8, 32, 56, 80, 104, 128, 152, 190, 214, 238].map((bx, i) => (
        <Binder key={bx} x={bx} y={128} h={[72, 64, 76, 60, 70, 78, 62, 70, 74, 58][i]} fill={BINDERS[i]} />
      ))}
      <Folder x={44} y={222} fill={C.sky} label="CALLS" s={0.8} r={tidy ? 0 : -3} />
      <Folder x={140} y={222} fill={C.paperDeep} label="NOTES" s={0.8} r={tidy ? 0 : 2} />
      <PaperStack x={222} y={222} n={5} w={56} />
      {/* floor: what the firm knows */}
      <Crate x={46} y={400} w={124} h={70} label="METHOD" fill={C.wood} />
      <Crate x={62} y={330} w={110} h={58} label="JUDGEMENT" fill={C.paperDeep} r={tidy ? 0 : -2} />
      <Crate x={176} y={400} w={118} h={60} label="PROPOSALS" fill={C.lilac} />
      <PaperStack x={176} y={340} n={4} w={74} />
      {/* the founder, at work */}
      <Armchair x={298} y={400} fill={C.lilac} s={0.95} />
      <Person x={290} y={384} s={0.95} sit shirt={C.paper} armL={[-26, -72]} armR={[40, -104]} />
      <At x={334} y={286}>
        <rect x={-18} y={-12} width={36} height={24} rx={1} fill={C.white} {...O} />
        <path d="M-11 -4 H11 M-11 3 H6" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
      </At>
      <Lamp x={232} y={400} s={0.9} />
      {/* the porthole to the outside */}
      <circle cx={500} cy={262} r={28} fill={C.sky} {...O} strokeWidth={2.4} />
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
      <rect x={16} y={240} width={228} height={90} rx={4} fill={C.sky} {...O} />
      <rect x={40} y={262} width={84} height={44} rx={2} fill={C.paper} {...O} />
      <path d="M52 278 H112 M52 290 H98" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
      <circle cx={186} cy={284} r={9} fill={C.paper} {...O} />
      <circle cx={214} cy={284} r={9} fill={C.gold} {...O} />
      <rect x={36} y={70} width={22} height={172} rx={2} fill={C.lilac} {...O} />
      <rect x={202} y={70} width={22} height={172} rx={2} fill={C.lilac} {...O} />
      <rect x={24} y={44} width={212} height={30} rx={2} fill={C.lilacDeep} {...O} />
      <Gear x={226} y={112} r={28} fill={C.paperDeep} />
      <circle cx={130} cy={150} r={34} fill={C.paper} {...O} />
      <circle cx={130} cy={222} r={34} fill={C.paper} {...O} />
      <path d="M130 124 V176 M104 150 H156 M130 196 V248 M104 222 H156" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <circle cx={130} cy={150} r={4} fill={C.ink} />
      <circle cx={130} cy={222} r={4} fill={C.ink} />
    </g>
  );
}

function Pole({ x, top, base }: { x: number; top: number; base: number }) {
  return (
    <g>
      <path d={`M${x} ${base} V${top}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${x} ${base} V${top}`} stroke={C.wood} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={top} r={6} fill={C.gold} {...O} />
    </g>
  );
}

const BUYERS = [C.lilac, C.sky, C.wood, C.paperDeep] as const;

export function HeroArt({ layout = "wide", evolved = false }: { layout?: "wide" | "tall"; evolved?: boolean }) {
  if (layout === "tall") {
    return (
      <svg viewBox="0 0 400 800" className="v5-art" role="img" aria-label="Inside the firm, a founder works among shelves and crates of expertise. A thread is drawn from a spool, through the Threadline press, and out as a line of pegged posts, videos and documents that buyers look up at. A reply travels back.">
        <Grain id="g-hero-t" />
        <rect x={0} y={744} width={400} height={56} fill={C.paper} />
        <path d="M0 744 H400" stroke={C.ink} strokeWidth={LINE} />
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
        <Pegged kind="post" x={104} y={538} r={5} s={0.74} />
        <Pegged kind="video" x={205} y={558} s={0.74} />
        <Pegged kind="doc" x={306} y={536} r={-5} s={0.74} />
        {evolved ? [140, 250, 340].map((kx, i) => <Knot key={kx} x={kx} y={[548, 560, 522][i]} s={0.8} />) : null}
        <Person x={92} y={744} s={0.62} shirt={BUYERS[0]} armL={[-24, -70]} armR={[26, -150]} />
        <Person x={210} y={744} s={0.62} shirt={BUYERS[1]} armL={[-24, -80]} armR={[22, -84]} />
        <Person x={318} y={744} s={0.62} flip shirt={BUYERS[2]} armL={[-24, -66]} armR={[28, -96]} />
        <Plate x={200} y={774} tone={C.white}>
          THE PEOPLE WHO MATTER
        </Plate>
        <rect width={400} height={800} filter="url(#g-hero-t)" opacity={0.5} pointerEvents="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1440 540" className="v5-art" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Inside the firm, a founder works among shelves and crates of expertise while a Threadline operator draws a thread from a spool. The thread runs through the workshop press and out over the market as a line of pegged posts, videos, documents and proof that a few buyers look up at. A reply travels back along the line.">
      <Grain id="g-hero" />
      {/* ground */}
      <rect x={0} y={482} width={1440} height={58} fill={C.paper} />
      <path d="M0 482 H1440" stroke={C.ink} strokeWidth={LINE} />
      <At x={0} y={82}>
        <Archive tidy={evolved} />
      </At>
      {/* the spool and the operator who draws the line */}
      <Spool x={404} y={434} s={0.9} />
      <Person x={452} y={478} s={0.92} shirt={C.sky} apron={C.gold} armL={[-30, -92]} armR={[34, -120]} />
      <At x={590} y={152}>
        <Press />
      </At>
      <Plate x={720} y={180} tone={C.white}>
        THREADLINE
      </Plate>
      {/* the thread: spool → press → up to the line */}
      <Thread draw d="M430 402 Q470 340 500 344 Q560 348 640 338 H800 Q850 338 868 96" />
      <Pole x={868} top={96} base={482} />
      <Pole x={1408} top={86} base={482} />
      <Thread draw d="M868 96 Q1138 262 1408 86" />
      <Pegged kind="post" x={976} y={149} r={6} />
      <Pegged kind="video" x={1084} y={172} r={2} />
      <Pegged kind="doc" x={1192} y={171} r={-2} />
      <Pegged kind="proof" x={1300} y={143} r={-6} />
      {evolved ? <Pegged kind="deep" x={912} y={118} r={8} s={0.7} /> : null}
      {evolved ? <Pegged kind="diagnostic" x={1360} y={118} r={-8} s={0.8} /> : null}
      {evolved ? [960, 1030, 1140, 1250, 1340].map((kx, i) => <Knot key={kx} x={kx} y={[150, 172, 176, 160, 128][i]} s={0.8} />) : null}
      {/* the people who matter */}
      <Person x={940} y={478} s={0.9} shirt={BUYERS[0]} armL={[-26, -70]} armR={[24, -158]} />
      <Person x={1080} y={478} s={0.9} shirt={BUYERS[1]} armL={[-22, -84]} armR={[20, -88]} />
      <At x={1080} y={392}>
        <rect x={-11} y={-18} width={22} height={36} rx={2} fill={C.navy} {...O} />
      </At>
      <Person x={1216} y={478} s={0.9} flip shirt={BUYERS[2]} armL={[-30, -64]} armR={[30, -104]} />
      <Person x={1340} y={478} s={0.9} flip shirt={BUYERS[3]} armL={[-28, -66]} armR={[26, -70]} />
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
