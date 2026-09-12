import { problem } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * SIGNATURE ANIMATION #2 — THE EXPERTISE VAULT.
 * A full-bleed band split hard down the firm boundary: NIGHT inside the firm,
 * BONE outside. As it reveals, the vault populates fast with paper expertise
 * blocks; the market side stays almost embarrassingly empty. One particularly
 * valuable card then tries to cross the boundary and stops at it. And, buried
 * under the internal material, a card labelled "The thing buyers always ask".
 */
export default function ProblemSection() {
  const p = problem;
  return (
    <section id="problem" className="section-problem">
      <div className="mk-container">
        <Reveal className="section-head problem-head">
          <span className="eyebrow-serif">{p.eyebrow}</span>
          <h2 className="h2-64">{p.headline}</h2>
          <p className="body-lead">{p.body}</p>
        </Reveal>
      </div>
      <div className="band-split">
        <div className="band-split-night" aria-hidden="true" />
        <Reveal className="scene scene-problem" once role="img" aria-label="Inside the firm, in the dark: a vault filling with expertise blocks, with a card labelled the thing buyers always ask buried underneath them. One card tries to cross the firm boundary and stops at it. Outside, in daylight: a website, two posts, and a buyer deciding on a referral and a deck.">
          <span className="scene-label pr-inside-label">{p.inside.label}</span>
          <div className="obj is-vermilion-soft token pr-buried">{p.buried}</div>
          {p.inside.blocks.slice(0, 14).map((b, i) => (
            <div key={b + i} className={`obj token pr-block is-${i + 1} assemble`} style={{ ['--i' as string]: 1 + (i % 7), ['--ay' as string]: '40px', ['--as' as string]: 0.92 }}>
              <span className="dot" />{b}
            </div>
          ))}
          <div className="obj token pr-cross assemble" style={{ ['--i' as string]: 8 }}><span className="dot" />{p.crossing}</div>
          <span className="scene-label pr-boundary-label">{p.boundary}</span>
          <span className="scene-label pr-outside-label">{p.outside.label}</span>
          {p.outside.fragments.map((f, i) => (
            <div key={f} className={`obj is-mist token pr-fragment is-${i + 1} assemble`} style={{ ['--i' as string]: 9 + i }}>{f}</div>
          ))}
          <span className="buyer pr-buyer is-l0 assemble" style={{ ['--i' as string]: 11 }} />
          <p className="scene-label pr-buyer-note assemble" style={{ ['--i' as string]: 12 }}>{p.outside.buyer}</p>
        </Reveal>
      </div>
    </section>
  );
}
