'use client';

import { useEffect, useRef } from 'react';
import { cycle } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * The twelve-week learning cycle — one continuous band, never four cards.
 * As the band scrolls through the viewport, hypotheses (stone dots) fade and
 * validated patterns (ember stacks) rise: increasing clarity over time.
 * One rAF-throttled scroll listener sets a single CSS variable.
 */
export default function CycleSection() {
  const c = cycle;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.setProperty('--p', '1'); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.9 + r.height * 0.4)));
      el.style.setProperty('--p', p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="cycle" className="section-cycle">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <Reveal className="section-head">
            <span className="eyebrow-serif">{c.eyebrow}</span>
            <h2 className="h2-64">{c.headline}</h2>
            <p className="body-lead">{c.body}</p>
          </Reveal>
          <Reveal className="cycle-band">
            <div ref={ref} className="scene scene-cycle" role="img" aria-label="Across four phases, many hypotheses fade and a few validated patterns grow.">
              {c.phases.map((p, i) => <span key={p.label} className={`scene-label cy-phase-label is-${i + 1}`}>{p.label}</span>)}
              {Array.from({ length: 12 }, (_, i) => <span key={i} className={`cy-dot is-${i + 1}`} />)}
              {[1, 2, 3].map(i => <div key={i} className={`cy-stack is-${i}`}>{Array.from({ length: 7 }, (_, j) => <span key={j} />)}</div>)}
              <div className="cy-base" />
              {[1, 2, 3, 4].map(i => <span key={i} className={`cy-stop is-${i}${i === 4 ? ' is-lit' : ''}`} />)}
            </div>
            <div className="cycle-phases">
              {c.phases.map(p => (
                <div key={p.label} className="cycle-phase">
                  <h3 className="h3-28">{p.label}</h3>
                  <p>{p.note}</p>
                </div>
              ))}
            </div>
            <div className="cycle-legend"><span className="is-hyp">{c.legend.hypotheses}</span><span className="is-val">{c.legend.validated}</span></div>
          </Reveal>
          <Reveal as="p" className="body-note" style={{ marginTop: 24 }}>{c.note}</Reveal>
        </div>
      </div>
    </section>
  );
}
