import * as React from "react";
import Link from "next/link";
import { burden, closing, comparison, cycle, diagnosis, expressions, fit, hero, memory, movement, problem, strip, workshop } from "@/content/marketing-v5";
import { HeroArt } from "./art/HeroArt";
import { ProblemArt } from "./art/ProblemArt";
import { MemoryArt } from "./art/MemoryArt";
import { BusyMachine, CalmFounder } from "./art/BurdenArt";
import { MovementArt } from "./art/MovementArt";
import { CycleArt, GateArt, TinyOperator } from "./art/SmallArt";
import { Thread } from "./art/kit";
import WorkshopStage from "./WorkshopStage";
import Expressions from "./Expressions";
import Bench from "./Bench";

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v5-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The thread crossing from one scene into the next. */
export function Seam({ from = 20, to = 80, tone }: { from?: number; to?: number; tone?: "light" | "dark" }) {
  return (
    <svg className={`v5-seam${tone === "dark" ? " is-dark" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M${from} 0 C${from} 55 ${to} 45 ${to} 100`} fill="none" stroke="var(--v5-ink)" strokeWidth={9} vectorEffect="non-scaling-stroke" />
      <path d={`M${from} 0 C${from} 55 ${to} 45 ${to} 100`} fill="none" stroke="var(--v5-gold)" strokeWidth={4.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Head({ eyebrow, title, body, id, on = "light", wide = false, mega = false }: { eyebrow: string; title: React.ReactNode; body?: string; id?: string; on?: "light" | "dark"; wide?: boolean; mega?: boolean }) {
  return (
    <header className={`v5-head${on === "dark" ? " is-on-dark" : ""}${wide ? " is-wide" : ""}`}>
      <p className="v5-eyebrow">{eyebrow}</p>
      <h2 id={id} className={mega ? "v5-mega" : "v5-h2"}>
        {title}
      </h2>
      {body ? <p className="v5-lead">{body}</p> : null}
    </header>
  );
}

/* 1 ---------------------------------------------------------------- hero */
export function Hero() {
  return (
    <section className="v5-hero" data-scene aria-labelledby="hero-title">
      <div className="v5-wrap">
        <p className="v5-eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title" className="v5-h1">
          {hero.headline}
        </h1>
        <div className="v5-hero-row">
          <p className="v5-lead">{hero.body}</p>
          <div className="v5-cta-row">
            <Link href={hero.cta.href} className="v5-btn is-lg">
              {hero.cta.label}
              <Arrow />
            </Link>
            <a href={hero.secondary.href} className="v5-btn is-lg is-ghost">
              {hero.secondary.label}
              <Arrow />
            </a>
          </div>
        </div>
      </div>
      <div className="v5-hero-art is-wide">
        <HeroArt />
      </div>
      <div className="v5-hero-art is-tall">
        <HeroArt layout="tall" />
      </div>
    </section>
  );
}

/* 1b ------------------------------------------------ the line of six tags */
export function Strip() {
  return (
    <section className="v5-strip" aria-label={strip.label} data-scene>
      <div className="v5-wrap">
        <div className="v5-strip-line" aria-hidden="true">
          <svg viewBox="0 0 1200 40" preserveAspectRatio="none">
            <Thread d="M0 8 Q300 40 600 12 T1200 8" />
          </svg>
        </div>
        <ol className="v5-tags">
          {strip.tags.map((t, i) => (
            <li key={t.figure} className="v5-tagline" style={{ ["--i" as string]: i }}>
              <span className="v5-peg" aria-hidden="true" />
              <span className="v5-tag-figure">{t.figure}</span>
              <span className="v5-tag-line">{t.line}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 2 ------------------------------------------------------------- problem */
export function Problem() {
  return (
    <section id="problem" className="v5-problem" data-scene aria-labelledby="problem-title">
      <Seam from={97} to={62} />
      <div className="v5-wrap">
        <Head eyebrow={problem.eyebrow} title={problem.headline} body={problem.body} id="problem-title" />
      </div>
      <div className="v5-problem-art is-wide">
        <ProblemArt />
      </div>
      <div className="v5-problem-art is-tall">
        <ProblemArt layout="tall" />
      </div>
    </section>
  );
}

/* 3 -------------------------------------------------------------- memory */
export function Memory() {
  return (
    <section id="memory" className="v5-memory" data-scene aria-labelledby="memory-title">
      <div className="v5-wrap">
        <p className="v5-eyebrow">{memory.eyebrow}</p>
        <h2 id="memory-title" className="v5-mega">
          <span>{memory.headline[0]}</span>
          <span className="is-soft">{memory.headline[1]}</span>
        </h2>
        <p className="v5-lead is-right">{memory.body}</p>
      </div>
      <div className="v5-memory-art is-wide">
        <MemoryArt />
      </div>
      <div className="v5-memory-art is-tall">
        <MemoryArt layout="tall" />
      </div>
      <div className="v5-wrap">
        <ol className="v5-encounters">
          {memory.encounters.map((e, i) => (
            <li key={e.label}>
              <span className="v5-tag">{String(i + 1).padStart(2, "0")}</span>
              <strong>{e.label}</strong>
              <span>{e.note}</span>
            </li>
          ))}
        </ol>
        <p className="v5-note">{memory.note}</p>
      </div>
    </section>
  );
}

/* 4 -------------------------------------------------------------- burden */
export function Burden() {
  return (
    <section id="burden" className="v5-burden" data-scene aria-labelledby="burden-title">
      <Seam from={30} to={64} />
      <div className="v5-wrap">
        <Head eyebrow={burden.eyebrow} title={burden.headline} id="burden-title" />
        <div className="v5-burden-grid">
          <div className="v5-burden-calm">
            <CalmFounder />
          </div>
          <div className="v5-burden-machine">
            <BusyMachine labels={burden.machine} />
          </div>
        </div>
        <div className="v5-burden-foot">
          <ol className="v5-verbs">
            {burden.you.map((y, i) => (
              <li key={y.verb}>
                <span className="v5-tag">{String(i + 1).padStart(2, "0")}</span>
                <strong>{y.verb}</strong>
                <span>{y.note}</span>
              </li>
            ))}
          </ol>
          <p className="v5-relief">{burden.relief}</p>
        </div>
      </div>
    </section>
  );
}

/* 5 ------------------------------------------------------------ workshop */
export function Workshop() {
  return (
    <section id="workshop" className="v5-workshop" data-scene aria-labelledby="workshop-title">
      <Seam from={64} to={22} tone="dark" />
      <div className="v5-wrap">
        <Head on="dark" eyebrow={workshop.eyebrow} title={workshop.headline} body={workshop.body} id="workshop-title" />
      </div>
      <WorkshopStage />
      <div className="v5-wrap">
        <p className="v5-note is-on-dark">{workshop.loop}</p>
      </div>
    </section>
  );
}

/* 6 --------------------------------------------------------- expressions */
export function ExpressionsSection() {
  return (
    <section id="expressions" className="v5-expressions" data-scene aria-labelledby="expr-title">
      <Seam from={22} to={78} />
      <div className="v5-wrap">
        <Head eyebrow={expressions.eyebrow} title={expressions.headline} body={expressions.body} id="expr-title" wide />
        <blockquote className="v5-thesis">
          <span className="v5-tag">{expressions.thesis.label}</span>
          <p>{expressions.thesis.text}</p>
        </blockquote>
        <Expressions />
        <p className="v5-note">{expressions.caveat}</p>
      </div>
    </section>
  );
}

/* 7 ------------------------------------------------------------ movement */
export function Movement() {
  const stamps = movement.steps.map((s) => s.evidence);
  return (
    <section id="movement" className="v5-movement" data-scene aria-labelledby="mv-title">
      <Seam from={78} to={12} />
      <div className="v5-wrap">
        <Head eyebrow={movement.eyebrow} title={movement.headline} body={movement.body} id="mv-title" />
      </div>
      <div className="v5-movement-art is-wide">
        <MovementArt stamps={stamps} />
      </div>
      <div className="v5-movement-art is-tall">
        <MovementArt layout="tall" stamps={stamps} />
      </div>
      <div className="v5-wrap">
        <ol className="v5-steps">
          {movement.steps.map((s, i) => (
            <li key={s.label}>
              <span className="v5-tag">{String(i + 1).padStart(2, "0")}</span>
              <strong>{s.label}</strong>
              <span>{s.note}</span>
            </li>
          ))}
        </ol>
        <p className="v5-note">{movement.honesty}</p>
      </div>
    </section>
  );
}

/* 8 ---------------------------------------------------------- diagnosis */
export function Diagnosis() {
  return (
    <section id="diagnosis" className="v5-diagnosis" data-scene aria-labelledby="dg-title">
      <Seam from={12} to={50} />
      <div className="v5-wrap">
        <div className="v5-diagnosis-grid">
          <Head eyebrow={diagnosis.eyebrow} title={diagnosis.headline} body={diagnosis.body} id="dg-title" />
          <Bench />
        </div>
      </div>
    </section>
  );
}

/* 9 --------------------------------------------------------------- cycle */
export function Cycle() {
  return (
    <section id="cycle" className="v5-cycle" data-scene aria-labelledby="cy-title">
      <Seam from={50} to={10} />
      <div className="v5-wrap">
        <Head eyebrow={cycle.eyebrow} title={cycle.headline} body={cycle.body} id="cy-title" />
      </div>
      <div className="v5-cycle-art">
        <CycleArt />
      </div>
      <div className="v5-wrap">
        <ol className="v5-phases">
          {cycle.phases.map((p, i) => (
            <li key={p.label}>
              <span className="v5-tag">{["Weeks 1–4", "Weeks 5–8", "Weeks 9–12"][i]}</span>
              <strong>{p.label}</strong>
              <span>{p.note}</span>
            </li>
          ))}
        </ol>
        <p className="v5-note">{cycle.note}</p>
      </div>
    </section>
  );
}

/* 10 --------------------------------------------------------- comparison */
export function Comparison() {
  const c = comparison;
  return (
    <section id="comparison" className="v5-compare" data-scene aria-labelledby="cp-title">
      <Seam from={10} to={28} />
      <div className="v5-wrap">
        <div className="v5-compare-grid">
          <Head eyebrow={c.eyebrow} title={c.headline} body={c.body} id="cp-title" />
          <div className="v5-abacus-wrap">
            <div className="v5-abacus" role="table" aria-label="What each alternative covers">
              <div className="v5-abacus-head" role="row">
                <span role="columnheader" className="v5-tag">
                  Alternative
                </span>
                {c.capabilities.map((cap) => (
                  <span key={cap} role="columnheader" className="v5-tag">
                    {cap}
                  </span>
                ))}
              </div>
              {c.rows.map((r) => (
                <div key={r.label} role="row" className={`v5-abacus-row${"own" in r && r.own ? " is-own" : ""}`}>
                  <span role="rowheader" className="v5-abacus-name">
                    <strong>{r.label}</strong>
                    <small>{r.note}</small>
                  </span>
                  {r.fill.map((v, j) => (
                    <span key={j} role="cell" className={`v5-bead${v >= 1 ? " is-full" : v > 0 ? " is-half" : ""}`} aria-label={`${c.capabilities[j]}: ${v >= 1 ? c.legend.full : v > 0 ? c.legend.half : c.legend.empty}`} />
                  ))}
                </div>
              ))}
            </div>
            <div className="v5-abacus-legend">
              <span>
                <i className="v5-bead is-full" /> {c.legend.full}
              </span>
              <span>
                <i className="v5-bead is-half" /> {c.legend.half}
              </span>
              <span>
                <i className="v5-bead" /> {c.legend.empty}
              </span>
            </div>
            <div className="v5-abacus-op" aria-hidden="true">
              <TinyOperator />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 11 ----------------------------------------------------------------- fit */
export function Fit() {
  return (
    <section id="fit" className="v5-fit" data-scene aria-labelledby="fit-title">
      <Seam from={86} to={50} />
      <div className="v5-wrap">
        <Head eyebrow={fit.eyebrow} title={fit.headline} id="fit-title" />
        <div className="v5-fit-grid">
          <div className="v5-fit-col is-yes">
            <p className="v5-tag">{fit.gate.yes}</p>
            <ul>
              {fit.good.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="v5-fit-gate">
            <GateArt />
          </div>
          <div className="v5-fit-col is-no">
            <p className="v5-tag">{fit.gate.no}</p>
            <ul>
              {fit.bad.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="v5-note">
          <Link href={fit.more.href} className="v5-link">
            {fit.more.label}
            <Arrow />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* 12 ------------------------------------------------------------- closing */
export function Closing() {
  return (
    <section id="closing" className="v5-closing" data-scene aria-labelledby="closing-title">
      <Seam from={50} to={60} tone="dark" />
      <div className="v5-wrap">
        <h2 id="closing-title" className="v5-h2 is-on-dark">
          <span>{closing.headline[0]}</span> <span className="is-soft">{closing.headline[1]}</span>
        </h2>
        <p className="v5-lead is-on-dark">{closing.body}</p>
        <div className="v5-cta-row">
          <Link href={closing.cta.href} className="v5-btn is-lg is-paper">
            {closing.cta.label}
            <Arrow />
          </Link>
          <Link href={closing.secondary.href} className="v5-btn is-lg is-ghost is-on-dark">
            {closing.secondary.label}
            <Arrow />
          </Link>
        </div>
      </div>
      <div className="v5-closing-art is-wide">
        <HeroArt evolved />
      </div>
      <div className="v5-closing-art is-tall">
        <HeroArt layout="tall" evolved />
      </div>
    </section>
  );
}
