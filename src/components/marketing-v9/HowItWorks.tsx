import * as React from "react";
import Link from "next/link";
import { HOME, HOW_IT_WORKS } from "@/content/public-site";
import { workshop } from "@/content/marketing-v5";
import Motion from "@/components/marketing-v5/Motion";
import Image from "next/image";
import StationLine from "./StationLine";

/**
 * How it works, in the homepage's system: a statement panel with the busy
 * workshop, the six-station line as the interactive stage in a night panel,
 * the seven stages as a ledger of tiles (the founder's three marked), the
 * four gates, the synthetic demonstration as a numbered chain, and the
 * hand-over to the application.
 */
const FOUNDER_AT: Record<string, string> = { raw: "Input", produce: "Record", response: "Sell" };

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HowItWorks() {
  const c = HOW_IT_WORKS;
  return (
    <div className="v9-home hw-page">
      <Motion />
      <section className="v9-hero" data-scene aria-labelledby="hw-title">
        <div className="v9-panel v9-hero-panel hw-hero-panel">
          <div className="v9-hero-copy">
            <p className="v9-eyebrow v9-reveal">How it works</p>
            <h1 id="hw-title" className="v9-h1 v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              {c.title}
            </h1>
            <p className="v9-lead v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              {c.lead}
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "240ms" }}>
              <Link href="/apply" className="v9-btn">
                See it run on your business
                <Arrow />
              </Link>
              <Link href="/playbook" className="v9-btn is-ghost">
                Read the Playbook
              </Link>
            </div>
          </div>
          <div className="hw-hero-scene v9-tile is-night is-photo v9-reveal" style={{ ["--d" as string]: "200ms" }}>
            <Image src="/marketing/howitworks-hero.jpg" alt="A long work bench with eight tools laid out in a row: a magnifying glass, an open ledger, a written sheet, a paper press, a crate, a peg on a short thread, a ticked sheet and a stack of paper. One operator stands behind the bench reaching for the press." width={1376} height={768} priority sizes="(max-width: 991px) 100vw, 640px" />
          </div>
        </div>
      </section>

      <section id="line" className="hw-line-section" data-scene aria-labelledby="hw-line-title">
        <div className="v9-panel is-night hw-line-panel">
          <header className="v9-head is-light v9-reveal">
            <p className="v9-eyebrow">The line, station by station</p>
            <h2 id="hw-line-title" className="v9-h2">
              {workshop.headline}
            </h2>
            <p className="v9-body">{workshop.body}</p>
          </header>
          <div className="hw-line v9-reveal">
            <StationLine />
          </div>
        </div>
      </section>

      <section id="stages" className="hw-stages" data-scene aria-labelledby="hw-stages-title">
        <div className="v9-wrap">
          <header className="v9-head v9-reveal">
            <p className="v9-eyebrow">Stage by stage</p>
            <h2 id="hw-stages-title" className="v9-h2">
              What happens at each stage, and who does it.
            </h2>
            <p className="v9-body">Seven stages every service period. You are needed at three of them, briefly. Everything else belongs to Threadline, and the last stage feeds the first.</p>
          </header>
          <ol className="hw-stage-list">
            {c.stages.map((s, i) => {
              const founder = FOUNDER_AT[s.key];
              return (
                <li key={s.key} id={s.key} className={`hw-stage v9-tile${founder ? " is-peach" : " is-paper"} v9-reveal`} style={{ ["--d" as string]: `${(i % 2) * 90}ms` }}>
                  <div className="hw-stage-head">
                    <span className="v9-tag">Stage {String(i + 1).padStart(2, "0")}</span>
                    <span className={`hw-who${founder ? " is-you" : ""}`}>{founder ? `You · ${founder}` : "Threadline"}</span>
                  </div>
                  <h3 className="v9-h3">{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="gates" className="hw-gates" data-scene aria-labelledby="hw-gates-title">
        <div className="v9-panel">
          <header className="v9-head is-center v9-reveal">
            <p className="v9-eyebrow">Gates</p>
            <h2 id="hw-gates-title" className="v9-h2">
              Four things the machine refuses to do.
            </h2>
            <p className="v9-body">Each gate is a rule in the software, not a policy in a document. They exist so that a fast operation cannot become a careless one.</p>
          </header>
          <ul className="hw-gate-list v9-reveal">
            {c.gates.map((g, i) => (
              <li key={g.label} className="hw-gate" style={{ ["--i" as string]: i }}>
                <span className="hw-gate-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
                <span className="v9-tag">Gate {String(i + 1).padStart(2, "0")}</span>
                <strong>{g.label}</strong>
                <p>{g.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="proof" className="hw-proof" data-scene aria-labelledby="hw-proof-title">
        <div className="v9-wrap">
          <header className="v9-head v9-reveal">
            <p className="v9-eyebrow">Step by step</p>
            <h2 id="hw-proof-title" className="v9-h2">
              How one idea moves through a service period.
            </h2>
            <p className="v9-body">Ten steps, in the order they happen. The idea, the rooms, the numbers and the decision are invented to show the shape of the work.</p>
          </header>
          <div className="hw-chain-wrap v9-reveal">
            <p className="hw-synthetic">
              <span className="pb-stamp">Illustrative</span>
              {HOME.proof.label}
            </p>
            <ol className="hw-chain">
              {HOME.proof.chain.map((step, i) => (
                <li key={step.label} className="hw-link" style={{ ["--i" as string]: i }}>
                  <span className="hw-link-knot" aria-hidden="true" />
                  <span className="v9-tag">
                    {String(i + 1).padStart(2, "0")} · {step.label}
                  </span>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="v9-closing hw-closing" data-scene aria-labelledby="hw-closing-title">
        <div className="v9-panel v9-closing-panel is-photo">
          <div className="v9-closing-copy">
            <h2 id="hw-closing-title" className="v9-h2 is-light v9-reveal">
              See it run <span className="is-soft">on your business.</span>
            </h2>
            <p className="v9-body is-light v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              Apply for a diagnosis. We read every application and reply either way, including when the answer is that we are not the right fit.
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              <Link href="/apply" className="v9-btn is-paper">
                Apply
                <Arrow />
              </Link>
              <Link href="/who-its-for" className="v9-btn is-ghost is-light">
                Who it is for
              </Link>
            </div>
          </div>
          <div className="v9-closing-scene is-photo">
            <Image src="/marketing/closing-scene.jpg" alt="At night, six finished pieces hang on a marigold line between two poles; the thread returns underneath to a spool on the ground." width={1376} height={768} sizes="(max-width: 991px) 100vw, 54vw" loading="eager" />
          </div>
        </div>
      </section>
    </div>
  );
}
