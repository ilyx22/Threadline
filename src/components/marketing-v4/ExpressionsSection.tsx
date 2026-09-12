'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { expressions } from '@/content/marketing-site';
import Reveal from './Reveal';
import { Frame } from './Frame';
import { ArrowLeft, ArrowRight } from './Icons';

/**
 * One idea, the right expressions — the reference's peeking rail (native
 * scroll-snap, arrows that disable at the ends). The root thesis is pinned on
 * the left; as the rail reveals, the expressions slide out of it one after
 * another, each with a different silhouette. Hover, focus or tap a derivative
 * for the one sentence that says why it exists.
 */
export default function ExpressionsSection() {
  const e = expressions;
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [pulsing, setPulsing] = useState<'prev' | 'next' | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  useEffect(() => { setTouch(window.matchMedia('(hover: none)').matches); }, []);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', sync); ro.disconnect(); };
  }, [sync]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const delta = first ? first.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
    setPulsing(dir === 1 ? 'next' : 'prev');
    window.setTimeout(() => setPulsing(null), 200);
  };

  const Nav = ({ placement }: { placement: 'm-hide' | 'd-hide' }) => (
    <div className={`rail-nav ${placement}`}>
      <button type="button" aria-label="Previous expression" disabled={atStart} onClick={() => step(-1)} className={`rail-btn${pulsing === 'prev' ? ' animate-scale' : ''}`}><ArrowLeft /></button>
      <button type="button" aria-label="Next expression" disabled={atEnd} onClick={() => step(1)} className={`rail-btn${pulsing === 'next' ? ' animate-scale' : ''}`}><ArrowRight /></button>
    </div>
  );

  return (
    <section id="expressions" className="section-expressions">
      <div className="padding-vertical padding-panel">
        <div className="panel expressions-panel">
          <div className="mk-container">
            <div className="expressions-head-wrapper">
              <Reveal className="section-head">
                <span className="eyebrow-serif">{e.eyebrow}</span>
                <h2 className="h2-64">{e.headline}</h2>
                <p className="body-lead">{e.body}</p>
              </Reveal>
              <Nav placement="m-hide" />
            </div>

            <div className="expressions-stage">
              <Reveal className="obj thesis-card is-unlock" once>
                <div className="thesis-band"><span className="label">{e.thesis.label}</span></div>
                <div className="thesis-body">{e.thesis.text}</div>
                <div className="thesis-lines"><span className="frame-line is-w90" /><span className="frame-line is-w60" /></div>
              </Reveal>
              <Reveal className="rail-wrap" once>
                <div className="swiper swiper-expressions">
                  <div className="swiper-wrapper" ref={trackRef}>
                    {e.frames.map((f, i) => (
                      <div className="swiper-slide" key={f.kind}>
                        <div
                          className="expression-slide assemble"
                          data-why={why === f.kind ? 'true' : 'false'}
                          style={{ ['--i' as string]: i + 2, ['--ax' as string]: '-120px', ['--ay' as string]: '0px', ['--as' as string]: 0.86 }}
                          onMouseEnter={() => { if (!touch) setWhy(f.kind); }}
                          onMouseLeave={() => { if (!touch) setWhy(null); }}
                        >
                          <Frame kind={f.kind} label={f.label} />
                          <div className="stack-8">
                            <h3 className="h3-28">{f.label}</h3>
                            <p>{f.line}</p>
                          </div>
                          <button type="button" className="expression-why-toggle" aria-expanded={why === f.kind} onClick={e => setWhy(w => (w === f.kind && (e.detail === 0 || touch) ? null : f.kind))} onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setWhy(f.kind); }} onBlur={() => setWhy(w => (w === f.kind ? null : w))}>
                            <span aria-hidden="true">?</span><span className="sr-only">Why this expression exists</span>
                          </button>
                          <p className="expression-why" aria-live="polite">{f.why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
            <Nav placement="d-hide" />
            <Reveal as="p" className="body-note expressions-caveat">{e.caveat}</Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
