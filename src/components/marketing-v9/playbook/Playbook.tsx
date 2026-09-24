import * as React from "react";
import Link from "next/link";
import { DIAGNOSTIC, HOME_V3, HOW_IT_WORKS, PLAYBOOK, PLAYBOOK_TOOLS } from "@/content/public-site";
import { MAXIMS, PERIODS, PERIODS_NOTE, PLAYBOOK_HERO } from "@/content/playbook";
import Motion from "@/components/marketing-v5/Motion";
import { Diagnostic } from "@/components/public/diagnostic";
import { AcquisitionCalculator } from "@/components/marketing-v5/AcquisitionCalculator";
import { Obj } from "../Obj";
import { CHAPTER_OBJECTS } from "./Chapter";
import { ProgressRail } from "./Progress";
import { Chapter } from "./Chapter";

/**
 * The Playbook as a single interactive page: a statement panel with a start
 * button and a time promise, a marquee of maxims, a sticky rail of ten
 * chapter marks, ten chapters each with a thing to do, two tools, the three
 * periods of a first engagement stated without promises, and the hand-over
 * to the application. Chapters keep their own routes for deep links.
 */
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Playbook() {
  const h = PLAYBOOK_HERO;
  return (
    <div className="v9-home pb-page">
      <Motion />
      <section className="v9-hero pb-hero" data-scene aria-labelledby="pb-title">
        <div className="v9-panel v9-hero-panel">
          <div className="v9-hero-copy">
            <p className="v9-eyebrow v9-reveal">{h.eyebrow}</p>
            <h1 id="pb-title" className="v9-h1 v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              {h.title[0]} <em className="pb-em">{h.title[1]}</em>
            </h1>
            <p className="v9-lead v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              {h.lead}
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "240ms" }}>
              <a href={h.start.href} className="v9-btn">
                {h.start.label}
                <Arrow />
              </a>
              <span className="pb-meta">{h.meta}</span>
            </div>
            <dl className="pb-facts v9-reveal" style={{ ["--d" as string]: "320ms" }}>
              {h.facts.map(([n, label]) => (
                <div key={label}>
                  <dt>{n}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ol className="pb-hero-map v9-reveal" aria-label="The ten chapters" style={{ ["--d" as string]: "200ms" }}>
            {PLAYBOOK.chapters.map((ch, i) => (
              <li key={ch.slug} style={{ ["--i" as string]: i }}>
                <a href={`#chapter-${i + 1}`} className="pb-map-tile">
                  <Obj name={CHAPTER_OBJECTS[i]} size={96} />
                  <span className="v9-tag">{String(i + 1).padStart(2, "0")}</span>
                  <strong>{ch.title}</strong>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v9-ticker" aria-label="What the system believes">
        <div className="v9-marquee" aria-hidden="true">
          <div className="v9-marquee-track">
            {[...MAXIMS, ...MAXIMS].map((m, i) => (
              <span key={i} className="v9-chip pb-maxim">
                {m}
              </span>
            ))}
          </div>
        </div>
        <ul className="v9-visually-hidden">
          {MAXIMS.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <ProgressRail />

      {PLAYBOOK.chapters.map((_, i) => (
        <Chapter key={i} index={i} />
      ))}

      <section id="tools" className="pb-tools" data-scene aria-labelledby="tools-title">
        <div className="v9-panel">
          <header className="v9-head is-center v9-reveal">
            <p className="v9-eyebrow">{PLAYBOOK_TOOLS.eyebrow}</p>
            <h2 id="tools-title" className="v9-h2">
              {PLAYBOOK_TOOLS.title}
            </h2>
            <p className="v9-body">{PLAYBOOK_TOOLS.lead}</p>
          </header>
          <div className="pb-tool v9-reveal">
            <div className="pb-tool-head">
              <p className="v9-eyebrow">{PLAYBOOK_TOOLS.diagnose.eyebrow}</p>
              <h3 className="v9-h3">{PLAYBOOK_TOOLS.diagnose.title}</h3>
              <p className="v9-body">{PLAYBOOK_TOOLS.diagnose.lead}</p>
            </div>
            <Diagnostic categories={DIAGNOSTIC.categories} chambers={HOME_V3.factory.chambers} stages={HOW_IT_WORKS.stages} symptoms={DIAGNOSTIC.symptoms} cta={DIAGNOSTIC.cta} />
          </div>
          <div className="pb-tool v9-reveal">
            <div className="pb-tool-head">
              <p className="v9-eyebrow">{PLAYBOOK_TOOLS.model.eyebrow}</p>
              <h3 className="v9-h3">{PLAYBOOK_TOOLS.model.title}</h3>
              <p className="v9-body">{PLAYBOOK_TOOLS.model.lead}</p>
            </div>
            <AcquisitionCalculator />
          </div>
        </div>
      </section>

      <section className="pb-periods" data-scene aria-labelledby="periods-title">
        <div className="v9-wrap">
          <header className="v9-head is-center v9-reveal">
            <p className="v9-eyebrow">What a first engagement feels like</p>
            <h2 id="periods-title" className="v9-h2">
              Period one is quiet. Period three is honest.
            </h2>
          </header>
          <ol className="pb-period-line v9-reveal">
            {PERIODS.map((p, i) => (
              <li key={p.label} className={`v9-tile ${["is-sky", "is-peach", "is-mint"][i]}`} style={{ ["--i" as string]: i }}>
                <span className="v9-tag">
                  {p.label} · {p.weeks}
                </span>
                <h3 className="v9-h3">{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
          <p className="v9-note is-center">{PERIODS_NOTE}</p>
        </div>
      </section>

      <section className="v9-closing pb-closing" data-scene aria-labelledby="pb-closing-title">
        <div className="v9-panel v9-closing-panel is-plain">
          <div className="v9-closing-copy">
            <h2 id="pb-closing-title" className="v9-h2 is-light v9-reveal">
              {PLAYBOOK.closing.title}
            </h2>
            <p className="v9-body is-light v9-reveal" style={{ ["--d" as string]: "80ms" }}>
              {PLAYBOOK.closing.lead}
            </p>
            <div className="v9-actions v9-reveal" style={{ ["--d" as string]: "160ms" }}>
              <Link href={PLAYBOOK.closing.cta.href} className="v9-btn is-paper">
                {PLAYBOOK.closing.cta.label}
                <Arrow />
              </Link>
              <Link href="/who-its-for" className="v9-btn is-ghost is-light">
                Who it is for
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
