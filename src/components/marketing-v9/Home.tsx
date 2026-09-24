import * as React from "react";
import Link from "next/link";
import { closing, expressions, fit, gap, hero, learning, memory, roles } from "@/content/home";
import { workshop } from "@/content/marketing-v5";
import Image from "next/image";
import Motion from "@/components/marketing-v5/Motion";
import Bench from "@/components/marketing-v5/Bench";
import { Obj, type ObjName } from "./Obj";
import { ExpressionsArt } from "./ExpressionsArt";

/**
 * The homepage, 24 September 2026 (second pass). The composition the owner
 * keeps pointing at: a pale canvas, one big white panel with a giant serif
 * statement and a scene that runs off its edge, a quiet ticker, a full-bleed
 * illustrated band with the next panel riding over it, pastel tiles that
 * carry artwork, a mosaic, and a landscape to end on. The illustrated
 * Threadline world supplies every scene, retoned to a brighter palette.
 */

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const YOU: { verb: string; obj: ObjName }[] = [
  { verb: "Talk", obj: "microphone" },
  { verb: "Record", obj: "camera" },
  { verb: "Approve", obj: "stamp" },
  { verb: "Sell", obj: "folder" },
];
const THREADLINE_JOBS: { job: string; obj: ObjName }[] = [
  { job: "Research", obj: "magnifier" },
  { job: "Positioning", obj: "ledger" },
  { job: "Scripting", obj: "sheet-written" },
  { job: "Editing", obj: "press" },
  { job: "Packaging", obj: "crate" },
  { job: "Distribution", obj: "peg" },
  { job: "Measurement", obj: "sheet-tick" },
  { job: "Diagnosis", obj: "paper-stack" },
];
const STATION_OBJECTS: ObjName[] = ["magnifier", "spool", "press", "peg", "ledger", "stamp"];

const ENCOUNTER_ALT = ["Seated on a train, reading a post on a phone.", "At a desk, reading a printed note.", "At a coffee table with a colleague, a short video on a small screen between them.", "At a boardroom table, holding up a document with a circled tick.", "Standing at a window, on a call."];

const TICKER = ["proposal decks", "delivery notes", "Slack threads", "partners’ heads", "pricing conversations", "post-mortems", "board memos", "private advice", "client calls", "the method nobody wrote down"];

function Head({ eyebrow, title, body, id, center = false, light = false }: { eyebrow: string; title: React.ReactNode; body?: string; id: string; center?: boolean; light?: boolean }) {
  return (
    <header className={`v9-head v9-reveal${center ? " is-center" : ""}${light ? " is-light" : ""}`}>
      <p className="v9-eyebrow">{eyebrow}</p>
      <h2 id={id} className="v9-h2">
        {title}
      </h2>
      {body ? <p className="v9-body">{body}</p> : null}
    </header>
  );
}

/* ------------------------------------------------------------------ 1 hero */
function Hero() {
  return (
    <section className="v9-hero" data-scene aria-labelledby="hero-title">
      <div className="v9-panel v9-hero-panel">
        <div className="v9-hero-copy">
          <p className="v9-eyebrow v9-reveal">{hero.eyebrow}</p>
          <h1 id="hero-title" className="v9-h1 v9-reveal" style={{ ["--d" as string]: "80ms" }}>
            {hero.headline}
          </h1>
          <p className="v9-lead v9-reveal" style={{ ["--d" as string]: "160ms" }}>
            {hero.lead}
          </p>
          <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "240ms" }}>
            <Link href={hero.cta.href} className="v9-btn">
              {hero.cta.label}
              <Arrow />
            </Link>
            <Link href={hero.secondary.href} className="v9-btn is-ghost">
              {hero.secondary.label}
            </Link>
          </div>
        </div>
        <div className="v9-hero-scene is-photo">
          <Image src="/marketing/hero-scene.jpg" alt="The firm's private archive on the left; one thread leaves it, passes through a small press and hangs four finished pieces on a line where four buyers stand looking up at them." width={1282} height={474} priority sizes="(max-width: 991px) 100vw, 58vw" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 2 ticker */
function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <section className="v9-ticker" aria-label="Where the expertise lives today">
      <p className="v9-ticker-line">The expertise already exists. Today it lives in</p>
      <div className="v9-marquee" aria-hidden="true">
        <div className="v9-marquee-track">
          {items.map((t, i) => (
            <span key={i} className="v9-chip">
              {t}
            </span>
          ))}
        </div>
      </div>
      <ul className="v9-visually-hidden">
        {TICKER.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------- 3 the gap, then memory */
function GapAndMemory() {
  return (
    <>
      <section id="gap" className="v9-gap" data-scene aria-labelledby="gap-title">
        <div className="v9-wrap">
          <Head eyebrow={gap.eyebrow} title={gap.headline} body={gap.body} id="gap-title" />
        </div>
        <div className="v9-band is-photo is-contained">
          <div className="v9-band-rooms">
            <figure className="v9-room">
              <Image src="/marketing/gap-left.jpg" alt="Inside the firm: a navy workroom with three tiers of shelves crammed with binders, folders and paper stacks, crates on the floor, and four partners working at two tables under lamps. A hatch in the wall on the right lets one thread out." width={1376} height={768} sizes="(max-width: 991px) 100vw, 620px" loading="eager" />
              <figcaption className="v9-band-plate is-left">
                <span className="v9-tag">{gap.inside.label}</span>
                <span>{gap.inside.note}</span>
              </figcaption>
            </figure>
            <figure className="v9-room">
              <Image src="/marketing/gap-right.jpg" alt="What the market sees: an almost empty pale room where one buyer holds two thin sheets beside a single framed board on a stand. The thread enters through the hatch on the left and reaches the buyer." width={1376} height={768} sizes="(max-width: 991px) 100vw, 620px" loading="eager" />
              <figcaption className="v9-band-plate is-right">
                <span className="v9-tag">{gap.outside.label}</span>
                <span>{gap.outside.note}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section id="memory" className="v9-memory" data-scene aria-labelledby="memory-title">
        <div className="v9-panel v9-memory-panel">
          <Head
            center
            eyebrow={memory.eyebrow}
            title={
              <>
                {memory.headline[0]} <span className="is-soft">{memory.headline[1]}</span>
              </>
            }
            id="memory-title"
          />
          <div className="v9-frieze is-tiles v9-reveal">
            <div className="v9-frieze-scroll">
              <ol className="v9-encounters" aria-label="Five encounters">
                {memory.encounters.map((e, i) => (
                  <li key={e.n} style={{ ["--i" as string]: i }}>
                    <span className="v9-encounter-art">
                      <Image src={`/marketing/memory/encounter-${i + 1}.jpg`} alt={ENCOUNTER_ALT[i]} width={420} height={420} sizes="(max-width: 991px) 180px, 230px" loading="eager" />
                    </span>
                    <span className="v9-tag">
                      {e.n} · {e.state}
                    </span>
                    <strong>{e.piece}</strong>
                    <span>{e.where}</span>
                  </li>
                ))}
              </ol>
              <svg className="v9-thread-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
                <path className="v9-thread-path" d="M0 20 H1000" fill="none" stroke="var(--v5-gold)" strokeWidth="2.4" />
                {[100, 300, 500, 700, 900].map((x) => (
                  <circle key={x} className="v9-thread-knot" cx={x} cy={20} r={6} fill="var(--v5-gold)" stroke="var(--v9-ink)" strokeWidth="1.6" />
                ))}
              </svg>
            </div>
          </div>
          <p className="v9-body is-center v9-reveal">{memory.body}</p>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- 4 burden */
function Burden() {
  return (
    <section id="roles" className="v9-burden" data-scene aria-labelledby="roles-title">
      <div className="v9-wrap">
        <div className="v9-burden-grid">
          <Head eyebrow={roles.eyebrow} title={roles.headline} body={roles.body} id="roles-title" />
          <ol className="v9-capsules v9-reveal" aria-label="What we need from you">
            {roles.you.rows.map((r, i) => (
              <li key={r.verb} className="v9-capsule" style={{ ["--i" as string]: i }}>
                <span className="v9-capsule-mark is-obj">
                  <Obj name={YOU.find((y) => y.verb === r.verb)?.obj ?? "folder"} size={44} />
                </span>
                <span className="v9-capsule-text">
                  <strong>{r.verb}</strong>
                  <span>{r.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="v9-burden-tiles">
          <div className="v9-tile is-sky v9-bench-tile v9-reveal">
            <ul className="v9-tools is-four" aria-label="What you do">
              {YOU.map((y, i) => (
                <li key={y.verb} style={{ ["--i" as string]: i }}>
                  <Obj name={y.obj} size={120} />
                  <span>{y.verb}</span>
                </li>
              ))}
            </ul>
            <p className="v9-tile-caption">
              <strong>What you do</strong>
              <span>Talk, record when useful, approve, sell.</span>
            </p>
          </div>
          <div className="v9-tile is-night v9-bench-tile v9-reveal" style={{ ["--d" as string]: "120ms" }}>
            <ul className="v9-tools is-eight is-light" aria-label="What Threadline does">
              {THREADLINE_JOBS.map((j, i) => (
                <li key={j.job} style={{ ["--i" as string]: i }}>
                  <Obj name={j.obj} size={96} />
                  <span>{j.job}</span>
                </li>
              ))}
            </ul>
            <p className="v9-tile-caption is-light">
              <strong>What Threadline does</strong>
              <span>{roles.handoff}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- 5 workshop */
const TONES = ["is-sky", "is-peach", "is-mint", "is-lilac", "is-butter", "is-sky"];
function Workshop() {
  return (
    <section id="workshop" className="v9-workshop" data-scene aria-labelledby="workshop-title">
      <div className="v9-panel v9-workshop-panel">
        <Head eyebrow={workshop.eyebrow} title={workshop.headline} body={workshop.body} id="workshop-title" />
        <ol className="v9-mosaic" aria-label="The six stations">
          {workshop.stations.map((s, i) => (
            <li key={s.key} className={`v9-tile v9-mosaic-tile ${TONES[i]}${[0, 3, 4].includes(i) ? " is-wide-tile" : ""} v9-reveal`} style={{ ["--i" as string]: i % 2 }}>
              <div className="v9-mosaic-art is-obj">
                <Obj name={STATION_OBJECTS[i]} size={260} big />
              </div>
              <div className="v9-mosaic-text">
                <span className="v9-tag">Station {String(i + 1).padStart(2, "0")}</span>
                <h3 className="v9-h3">{s.title}</h3>
                <p>{s.plain}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="v9-note is-center">{workshop.loop}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ 6 expressions */
function Expressions() {
  const e = expressions;
  return (
    <section id="expressions" className="v9-expressions" data-scene aria-labelledby="expressions-title">
      <div className="v9-wrap">
        <Head eyebrow={e.eyebrow} title={e.headline} body={e.body} id="expressions-title" />
        <div className="v9-line-art v9-reveal">
          <ExpressionsArt />
        </div>
        <ol className="v9-forms v9-reveal">
          {e.forms.map((f, i) => (
            <li key={f.kind} style={{ ["--i" as string]: i }}>
              <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
              <strong>{f.kind}</strong>
              <span>{f.role}</span>
              <small>{f.room}</small>
            </li>
          ))}
        </ol>
        <p className="v9-route v9-reveal">
          {e.route.map((r, i) => (
            <span key={r}>
              {i > 0 ? <i aria-hidden="true">→</i> : null}
              {r}
            </span>
          ))}
        </p>
        <p className="v9-note">{e.routeNote}</p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- 7 learning */
function Learning() {
  return (
    <section id="learning" className="v9-learning" data-scene aria-labelledby="learning-title">
      <div className="v9-panel v9-learning-panel">
        <div className="v9-learning-grid">
          <Head eyebrow={learning.eyebrow} title={learning.headline} body={learning.body} id="learning-title" />
          <div className="v9-learning-scene v9-reveal" style={{ ["--d" as string]: "120ms" }}>
            <Image src="/marketing/learning-scene.jpg" alt="A work bench. A printed sheet stands on an easel above a row of five wooden blocks; an inspector has lifted one block out and a fresh mint-green block waits beside the gap. Three measuring jars stand to the right, each with a marigold marker clipped at a different height." width={1310} height={453} sizes="(max-width: 991px) 100vw, 560px" loading="eager" />
          </div>
        </div>
        <div className="v9-learning-bench v9-reveal">
          <Bench />
        </div>
        <p className="v9-more">
          <Link href={learning.more.href} className="v9-link">
            {learning.more.label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- 8 fit */
function Fit() {
  return (
    <section id="fit" className="v9-fit" data-scene aria-labelledby="fit-title">
      <div className="v9-wrap">
        <Head center eyebrow={fit.eyebrow} title={fit.headline} body={fit.body} id="fit-title" />
        <div className="v9-fit-grid is-two v9-reveal">
          <div className="v9-fit-col">
            <p className="v9-tag">{fit.good.label}</p>
            <ul className="v9-fit-list is-good">
              {fit.good.items.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="v9-fit-col">
            <p className="v9-tag">{fit.bad.label}</p>
            <ul className="v9-fit-list is-bad">
              {fit.bad.items.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="v9-more is-center">
          <Link href={fit.more.href} className="v9-link">
            {fit.more.label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 9 closing */
function Closing() {
  return (
    <section id="closing" className="v9-closing" data-scene aria-labelledby="closing-title">
      <div className="v9-panel v9-closing-panel is-photo">
        <div className="v9-closing-copy">
          <h2 id="closing-title" className="v9-h2 is-light v9-reveal">
            {closing.headline[0]} <span className="is-soft">{closing.headline[1]}</span>
          </h2>
          <p className="v9-body is-light v9-reveal" style={{ ["--d" as string]: "80ms" }}>
            {closing.body}
          </p>
          <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "160ms" }}>
            <Link href={closing.cta.href} className="v9-btn is-paper">
              {closing.cta.label}
              <Arrow />
            </Link>
            <Link href={closing.secondary.href} className="v9-btn is-ghost is-light">
              {closing.secondary.label}
            </Link>
          </div>
        </div>
        <div className="v9-closing-scene is-photo">
          <Image src="/marketing/closing-scene.jpg" alt="At night, six finished pieces hang on a marigold line between two poles; the thread returns underneath to a spool on the ground." width={1376} height={768} sizes="(max-width: 991px) 100vw, 54vw" loading="eager" />
        </div>
      </div>
      <div className="v9-wordmark-marquee" aria-hidden="true">
        <div className="v9-wordmark-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>Threadline</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeV9() {
  return (
    <div className="v9-home">
      <Motion />
      <Hero />
      <Ticker />
      <GapAndMemory />
      <Burden />
      <Workshop />
      <Expressions />
      <Learning />
      <Fit />
      <Closing />
    </div>
  );
}
