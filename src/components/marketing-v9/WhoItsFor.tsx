import * as React from "react";
import Link from "next/link";
import { WHO_ITS_FOR } from "@/content/public-site";
import { fit } from "@/content/home";
import Motion from "@/components/marketing-v5/Motion";
import { GateArt } from "@/components/marketing-v5/art/SmallArt";
import { HeroArt } from "@/components/marketing-v5/art/HeroArt";

/**
 * Who it is for, in the homepage's system: a statement panel with the gate,
 * the profile as a ledger of white tiles, the fit in one look as two pastel
 * columns, the research-focus note, and the hand-over to the application.
 */
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function WhoItsFor() {
  const c = WHO_ITS_FOR;
  return (
    <div className="v9-home wf-page">
      <Motion />
      <section className="v9-hero" data-scene aria-labelledby="wf-title">
        <div className="v9-panel v9-hero-panel wf-hero-panel">
          <div className="v9-hero-copy">
            <p className="v9-eyebrow v9-reveal">Who it is for</p>
            <h1 id="wf-title" className="v9-h1 v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              {c.title}
            </h1>
            <p className="v9-lead v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              {c.lead}
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "240ms" }}>
              <Link href="/apply" className="v9-btn">
                See if Threadline fits
                <Arrow />
              </Link>
              <Link href="/how-it-works" className="v9-btn is-ghost">
                How it works
              </Link>
            </div>
          </div>
          <div className="wf-gate v9-reveal" style={{ ["--d" as string]: "200ms" }}>
            <GateArt />
          </div>
        </div>
      </section>

      <section className="wf-profile" data-scene aria-labelledby="wf-profile-title">
        <div className="v9-wrap">
          <header className="v9-head v9-reveal">
            <p className="v9-eyebrow">The profile</p>
            <h2 id="wf-profile-title" className="v9-h2">
              Seven things that are usually true of the firms it works for.
            </h2>
          </header>
          <dl className="wf-ledger">
            {c.profile.map((p, i) => (
              <div key={p.label} className="wf-row v9-reveal" style={{ ["--d" as string]: `${(i % 2) * 90}ms` }}>
                <dt>
                  <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
                  <strong>{p.label}</strong>
                </dt>
                <dd>{p.body}</dd>
              </div>
            ))}
          </dl>
          <p className="v9-note">{c.wedgeNote}</p>
        </div>
      </section>

      <section className="wf-fit" data-scene aria-labelledby="wf-fit-title">
        <div className="v9-panel">
          <header className="v9-head is-center v9-reveal">
            <p className="v9-eyebrow">Plainly</p>
            <h2 id="wf-fit-title" className="v9-h2">
              The fit, in one look.
            </h2>
          </header>
          <div className="wf-fit-grid">
            <div className="v9-tile is-sky wf-fit-col v9-reveal">
              <p className="v9-tag">{fit.good.label}</p>
              <ul className="v9-fit-list is-good">
                {fit.good.items.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div className="v9-tile is-peach wf-fit-col v9-reveal" style={{ ["--d" as string]: "120ms" }}>
              <p className="v9-tag">{fit.bad.label}</p>
              <ul className="v9-fit-list is-bad">
                {fit.bad.items.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="v9-closing" data-scene aria-labelledby="wf-closing-title">
        <div className="v9-panel v9-closing-panel">
          <div className="v9-closing-copy">
            <h2 id="wf-closing-title" className="v9-h2 is-light v9-reveal">
              Not sure? <span className="is-soft">Apply and find out.</span>
            </h2>
            <p className="v9-body is-light v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              The application is a diagnostic. If the honest answer is that Threadline is the wrong tool for your business, we will say so, and you keep the finding.
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              <Link href="/apply" className="v9-btn is-paper">
                Apply
                <Arrow />
              </Link>
              <Link href="/playbook" className="v9-btn is-ghost is-light">
                Read the Playbook first
              </Link>
            </div>
          </div>
          <div className="v9-closing-scene is-wide">
            <HeroArt evolved />
          </div>
          <div className="v9-closing-scene is-tall">
            <HeroArt layout="tall" evolved />
          </div>
        </div>
      </section>
    </div>
  );
}
