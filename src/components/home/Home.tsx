import * as React from "react";
import Link from "next/link";
import { closing, expressions, fit, gap, hero, learning, memory, roles, workshop } from "@/content/home";
import Motion from "@/components/marketing-v5/Motion";
import Workshop from "./Workshop";
import Loop from "./Loop";

/**
 * The homepage, 24 September 2026. Eight parts in one narrative: proposition
 * and fit; the visibility gap; market memory; the working relationship; the
 * Authority Workshop; one idea, the right expressions; commercial learning;
 * fit and action. Paper, hairlines, ink, one accent. Objects are drawn in
 * HTML and CSS; the two interactive pieces read in full without scripting.
 */

const Arrow = () => (
  <svg viewBox="0 0 20 20" className="h-arrow" aria-hidden="true">
    <path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Head({ index, eyebrow, title, body, id, wide = false }: { index: string; eyebrow: string; title: React.ReactNode; body?: string; id: string; wide?: boolean }) {
  return (
    <header className={`h-head${wide ? " is-wide" : ""}`}>
      <p className="h-eyebrow">
        <span className="h-index">{index}</span>
        {eyebrow}
      </p>
      <h2 id={id} className="h-h2">
        {title}
      </h2>
      {body ? <p className="h-body">{body}</p> : null}
    </header>
  );
}

/* 1 ------------------------------------------------------------------ hero */
function Hero() {
  const d = hero.desk;
  return (
    <section className="h-hero" data-scene aria-labelledby="hero-title">
      <div className="h-wrap h-hero-grid">
        <div className="h-hero-copy">
          <p className="h-eyebrow">{hero.eyebrow}</p>
          <h1 id="hero-title" className="h-h1">
            {hero.headline}
          </h1>
          <p className="h-lead">{hero.lead}</p>
          <div className="h-actions">
            <Link href={hero.cta.href} className="h-btn">
              {hero.cta.label}
              <Arrow />
            </Link>
            <Link href={hero.secondary.href} className="h-btn is-quiet">
              {hero.secondary.label}
              <Arrow />
            </Link>
          </div>
          <p className="h-note">{hero.fit}</p>
        </div>
        <div className="h-desk" aria-label={d.label}>
          <p className="h-label h-desk-label">{d.label}</p>
          <div className="h-stack">
            {[...d.sheets].reverse().map((s, i) => {
              const front = i === d.sheets.length - 1;
              return (
                <div key={s.kind} className={`h-sheet h-stack-sheet${front ? " is-front" : " is-back"}`} style={{ ["--i" as string]: i }}>
                  <div className="h-sheet-head">
                    <span className="h-label">{s.kind}</span>
                    {front ? <span className="h-stamp">{d.stamp}</span> : <span className="h-label is-quiet">{s.meta.split(" · ")[0]}</span>}
                  </div>
                  <p className="h-sheet-title">{s.title}</p>
                  <p className="h-sheet-meta">{s.meta}</p>
                </div>
              );
            })}
          </div>
          <dl className="h-desk-ledger">
            {d.ledger.map(([k, v]) => (
              <div key={k}>
                <dt className="h-label">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* 2 ------------------------------------------------------------------- gap */
function Gap() {
  return (
    <section id="gap" className="h-section h-gap" data-scene aria-labelledby="gap-title">
      <div className="h-wrap">
        <Head index={gap.index} eyebrow={gap.eyebrow} title={gap.headline} body={gap.body} id="gap-title" />
        <div className="h-gap-grid">
          <div className="h-sheet h-gap-inside">
            <div className="h-sheet-head">
              <span className="h-label">{gap.inside.label}</span>
              <span className="h-label is-quiet">{gap.inside.note}</span>
            </div>
            <ol className="h-index-list">
              {gap.inside.items.map((it, i) => (
                <li key={it}>
                  <span className="h-index">{String(i + 1).padStart(2, "0")}</span>
                  {it}
                </li>
              ))}
            </ol>
          </div>
          <div className="h-gap-strand" aria-hidden="true">
            <span className="h-gap-strand-line" />
            <span className="h-gap-strand-dot" />
            <span className="h-label">{gap.strand}</span>
          </div>
          <div className="h-sheet h-gap-outside">
            <div className="h-sheet-head">
              <span className="h-label">{gap.outside.label}</span>
              <span className="h-label is-quiet">{gap.outside.note}</span>
            </div>
            <ol className="h-index-list is-sparse">
              {gap.outside.items.map((it, i) => (
                <li key={it}>
                  <span className="h-index">{String(i + 1).padStart(2, "0")}</span>
                  {it}
                </li>
              ))}
            </ol>
            <p className="h-gap-empty">
              <span className="h-label">Everything else</span>
              Unseen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3 ---------------------------------------------------------------- memory */
function Memory() {
  return (
    <section id="memory" className="h-section h-memory" data-scene aria-labelledby="memory-title">
      <div className="h-wrap">
        <Head
          index={memory.index}
          eyebrow={memory.eyebrow}
          title={
            <>
              {memory.headline[0]} <span className="is-soft">{memory.headline[1]}</span>
            </>
          }
          body={memory.body}
          id="memory-title"
          wide
        />
        <ol className="h-encounters" aria-label="Five encounters with one buyer">
          {memory.encounters.map((e, i) => (
            <li key={e.n} className="h-encounter" style={{ ["--i" as string]: i }}>
              <span className="h-encounter-tick" aria-hidden="true" />
              <div className="h-sheet h-ticket">
                <span className="h-label">{e.piece}</span>
                <span className="h-ticket-where">{e.where}</span>
                <span className="h-ticket-marks" aria-hidden="true">
                  {Array.from({ length: i + 1 }).map((_, k) => (
                    <i key={k} />
                  ))}
                </span>
              </div>
              <p className="h-encounter-state">
                <span className="h-index">{e.n}</span>
                {e.state}
              </p>
            </li>
          ))}
        </ol>
        <p className="h-caption">{memory.caption}</p>
      </div>
    </section>
  );
}

/* 4 ----------------------------------------------------------------- roles */
function Roles() {
  return (
    <section id="roles" className="h-section h-roles" data-scene aria-labelledby="roles-title">
      <div className="h-wrap">
        <Head index={roles.index} eyebrow={roles.eyebrow} title={roles.headline} body={roles.body} id="roles-title" wide />
        <div className="h-roles-grid">
          <div className="h-roles-col is-you">
            <p className="h-label h-roles-label">{roles.you.label}</p>
            <ul className="h-roles-list">
              {roles.you.rows.map((r) => (
                <li key={r.verb}>
                  <strong>{r.verb}</strong>
                  <span>{r.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-roles-handoff" aria-hidden="true">
            <span className="h-roles-handoff-line" />
            <span className="h-label">Approve</span>
            <span className="h-roles-handoff-line" />
          </div>
          <div className="h-roles-col is-threadline">
            <p className="h-label h-roles-label">{roles.threadline.label}</p>
            <ul className="h-roles-list is-dense">
              {roles.threadline.rows.map((r) => (
                <li key={r.verb}>
                  <strong>{r.verb}</strong>
                  <span>{r.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="h-caption">{roles.handoff}</p>
      </div>
    </section>
  );
}

/* 5 -------------------------------------------------------------- workshop */
function WorkshopSection() {
  return (
    <section id="workshop" className="h-section h-workshop-section" data-scene aria-labelledby="workshop-title">
      <div className="h-wrap">
        <Head index={workshop.index} eyebrow={workshop.eyebrow} title={workshop.headline} body={workshop.body} id="workshop-title" />
        <Workshop />
      </div>
    </section>
  );
}

/* 6 ----------------------------------------------------------- expressions */
function Expressions() {
  const e = expressions;
  return (
    <section id="expressions" className="h-section h-expressions" data-scene aria-labelledby="expressions-title">
      <div className="h-wrap">
        <Head index={e.index} eyebrow={e.eyebrow} title={e.headline} body={e.body} id="expressions-title" />
        <div className="h-tree">
          <div className="h-sheet h-tree-root">
            <div className="h-sheet-head">
              <span className="h-label">{e.root.label}</span>
              <span className="h-stamp">{e.root.stamp}</span>
            </div>
            <p className="h-sheet-title is-lg">{e.root.title}</p>
          </div>
          <div className="h-tree-spine" aria-hidden="true" />
          <ol className="h-tree-forms">
            {e.forms.map((f, i) => (
              <li key={f.kind} className="h-tree-form" style={{ ["--i" as string]: i }}>
                <span className="h-tree-tick" aria-hidden="true" />
                <div className="h-sheet h-form">
                  <span className="h-label">{f.kind}</span>
                  <p className="h-form-role">{f.role}</p>
                  <p className="h-form-room">
                    <span className="h-label is-quiet">Room</span>
                    {f.room}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="h-route">
          <ol className="h-route-steps">
            {e.route.map((r, i) => (
              <li key={r}>
                <span className="h-index">0{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
          <p className="h-note">{e.routeNote}</p>
        </div>
      </div>
    </section>
  );
}

/* 7 -------------------------------------------------------------- learning */
function Learning() {
  return (
    <section id="learning" className="h-section h-learning" data-scene aria-labelledby="learning-title">
      <div className="h-wrap">
        <Head index={learning.index} eyebrow={learning.eyebrow} title={learning.headline} body={learning.body} id="learning-title" />
        <Loop />
        <p className="h-more">
          <Link href={learning.more.href} className="h-link">
            {learning.more.label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* 8 ------------------------------------------------------------------- fit */
function Fit() {
  return (
    <section id="fit" className="h-section h-fit" data-scene aria-labelledby="fit-title">
      <div className="h-wrap">
        <Head index={fit.index} eyebrow={fit.eyebrow} title={fit.headline} body={fit.body} id="fit-title" />
        <div className="h-fit-grid">
          <div className="h-fit-col">
            <p className="h-label">{fit.good.label}</p>
            <ul className="h-fit-list is-good">
              {fit.good.items.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="h-fit-col">
            <p className="h-label">{fit.bad.label}</p>
            <ul className="h-fit-list is-bad">
              {fit.bad.items.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="h-more">
          <Link href={fit.more.href} className="h-link">
            {fit.more.label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section id="closing" className="h-closing" data-scene aria-labelledby="closing-title">
      <div className="h-wrap h-closing-grid">
        <div>
          <h2 id="closing-title" className="h-h2 is-on-dark">
            {closing.headline[0]} <span className="is-soft">{closing.headline[1]}</span>
          </h2>
          <p className="h-body is-on-dark">{closing.body}</p>
        </div>
        <div className="h-actions is-vertical">
          <Link href={closing.cta.href} className="h-btn is-paper">
            {closing.cta.label}
            <Arrow />
          </Link>
          <Link href={closing.secondary.href} className="h-btn is-quiet is-on-dark">
            {closing.secondary.label}
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="h-home">
      <Motion />
      <Hero />
      <Gap />
      <Memory />
      <Roles />
      <WorkshopSection />
      <Expressions />
      <Learning />
      <Fit />
      <Closing />
    </div>
  );
}
