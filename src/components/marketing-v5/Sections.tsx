import * as React from "react";
import Link from "next/link";
import { burden, closing, comparison, diagnosis, engagement, fit, hero, problem, workshop } from "@/content/marketing-v5";
import { HeroArt } from "./art/HeroArt";
import { ProblemArt } from "./art/ProblemArt";
import { MemoryArt } from "./art/MemoryArt";
import { EngagementArt } from "./art/EngagementArt";
import { BusyMachine, CalmFounder } from "./art/BurdenArt";
import { GateArt } from "./art/SmallArt";
import WorkshopStage from "./WorkshopStage";
import Bench from "./Bench";

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v5-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The thread crossing from one scene into the next. */
export function Seam({ from = 20, to = 80 }: { from?: number; to?: number }) {
  void from;
  void to;
  return null;
}

function Head({ eyebrow, title, body, id, on = "light", mega = false }: { eyebrow: string; title: React.ReactNode; body?: string; id?: string; on?: "light" | "dark"; mega?: boolean }) {
  return (
    <header className={`v5-head${on === "dark" ? " is-on-dark" : ""}`}>
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

/* 2 ------------------------------------------- the problem and the outcome */
export function Problem() {
  const m = problem.memory;
  return (
    <section id="problem" className="v5-problem" data-scene aria-labelledby="problem-title">
      <Seam from={94} to={62} />
      <div className="v5-wrap">
        <Head eyebrow={problem.eyebrow} title={problem.headline} body={problem.body} id="problem-title" />
      </div>
      <div className="v5-problem-art is-wide">
        <ProblemArt />
      </div>
      <div className="v5-problem-art is-tall">
        <ProblemArt layout="tall" />
      </div>
      <div className="v5-wrap v5-memory" id="memory">
        <p className="v5-eyebrow">{m.eyebrow}</p>
        <h3 className="v5-mega">
          <span>{m.headline[0]}</span>
          <span className="is-soft">{m.headline[1]}</span>
        </h3>
        <p className="v5-lead is-right">{m.body}</p>
      </div>
      <div className="v5-memory-art is-wide">
        <MemoryArt />
      </div>
      <div className="v5-memory-art is-tall">
        <MemoryArt layout="tall" />
      </div>
    </section>
  );
}

/* 3 ---------------------------------------------------- what you receive */
export function Engagement() {
  const e = engagement;
  return (
    <section id="engagement" className="v5-engagement" data-scene aria-labelledby="engagement-title">
      <Seam from={8} to={30} />
      <div className="v5-wrap">
        <div className="v5-engagement-grid">
          <div className="v5-engagement-copy">
            <Head eyebrow={e.eyebrow} title={e.headline} body={e.body} id="engagement-title" />
            <p className="v5-tag is-warn">{e.illustrative}</p>
            <ol className="v5-engagement-steps">
              {e.rows.map((r, i) => (
                <li key={r.key}>
                  <span className="v5-tag">
                    {String(i + 1).padStart(2, "0")} · {r.week}
                  </span>
                  <strong>{r.title}</strong>
                  <p>{r.text}</p>
                </li>
              ))}
            </ol>
            <p className="v5-note">{e.cadence}</p>
            <p className="v5-note">{e.caveat}</p>
          </div>
          <div className="v5-engagement-sheet">
            <EngagementArt steps={e.rows.map((r) => r.title)} />
          </div>
        </div>
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
        <Head eyebrow={burden.eyebrow} title={burden.headline} body={burden.body} id="burden-title" />
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
      <Seam from={64} to={22} />
      <div className="v5-wrap">
        <Head on="dark" eyebrow={workshop.eyebrow} title={workshop.headline} body={workshop.body} id="workshop-title" />
        <WorkshopStage />
        <p className="v5-note is-on-dark">{workshop.loop}</p>
      </div>
    </section>
  );
}

/* 6 ---------------------------------------------------------- diagnosis */
export function Diagnosis() {
  return (
    <section id="diagnosis" className="v5-diagnosis" data-scene aria-labelledby="dg-title">
      <Seam from={22} to={50} />
      <div className="v5-wrap">
        <div className="v5-diagnosis-grid">
          <Head eyebrow={diagnosis.eyebrow} title={diagnosis.headline} body={diagnosis.body} id="dg-title" />
          <Bench />
        </div>
      </div>
    </section>
  );
}

/* 7 ----------------------------------------------------------------- fit */
export function Fit() {
  const c = comparison;
  return (
    <section id="fit" className="v5-fit" data-scene aria-labelledby="fit-title">
      <Seam from={50} to={12} />
      <div className="v5-wrap">
        <Head eyebrow={fit.eyebrow} title={fit.headline} body={fit.body} id="fit-title" />
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

        <div className="v5-compare" id="comparison">
          <div className="v5-compare-grid">
            <header className="v5-head">
              <p className="v5-eyebrow">{c.eyebrow}</p>
              <h3 className="v5-h3">{c.headline}</h3>
              <p className="v5-note">{c.body}</p>
            </header>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 8 ------------------------------------------------------------- closing */
export function Closing() {
  return (
    <section id="closing" className="v5-closing" data-scene aria-labelledby="closing-title">
      <Seam from={12} to={60} />
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
