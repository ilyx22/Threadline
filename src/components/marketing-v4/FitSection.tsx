import { fit } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * Who it is for — physical sorting. Verdict cards arrive from the middle and
 * slot into their column: the good fits to the left, the poor fits to the
 * right. The sorting is the verdict; the marks are small.
 */
export default function FitSection() {
  return (
    <section id="fit" className="section-fit">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <Reveal className="section-head">
            <span className="eyebrow-serif">{fit.eyebrow}</span>
            <h2 className="h2-64">{fit.headline}</h2>
          </Reveal>
          <div className="fit-grid">
            <Reveal as="ul" className="fit-col" aria-label="A strong fit">
              <li className="label" style={{ color: 'var(--color-cobalt)' }}>A strong fit</li>
              {fit.good.map((g, i) => (
                <li key={g} className="verdict is-yes assemble" style={{ ['--i' as string]: i, ['--ax' as string]: '72px', ['--ay' as string]: '0px' }}><span className="verdict-mark" aria-hidden="true">✓</span>{g}</li>
              ))}
            </Reveal>
            <Reveal as="ul" className="fit-col" aria-label="Not our model">
              <li className="label" style={{ color: 'var(--color-steel)' }}>Not our model</li>
              {fit.bad.map((b, i) => (
                <li key={b} className="verdict is-no assemble" style={{ ['--i' as string]: i, ['--ax' as string]: '-72px', ['--ay' as string]: '0px' }}><span className="verdict-mark" aria-hidden="true">✕</span>{b}</li>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
