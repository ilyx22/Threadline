'use client';

import { useEffect, useRef, useState } from 'react';
import { memory } from '@/content/marketing-site';
import Reveal from './Reveal';
import { Frame } from './Frame';

/**
 * SIGNATURE ANIMATION #3 — MARKET MEMORY.
 * Not audience growth: memory formation. One relevant buyer in a small pool.
 * Five pieces pass them in turn (styles/scenes.css, `.scene-memory`):
 *   a company update — ignored (the buyer does not move);
 *   a written idea    — RECOGNISE  (a ring);
 *   the judgement     — REMEMBER   (a stronger ring, the buyer edges closer);
 *   a proof asset     — TRUST      (cobalt fill);
 *   a trigger         — CONVERSATION (vermilion).
 * Each encounter stamps the trace beneath. Hover or tap a stamp for its one
 * line. Reduced motion shows the final state.
 */
export default function MemorySection() {
  const m = memory;
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState<'0' | '1' | 'still'>('0');
  const [open, setOpen] = useState<number | null>(null);
  const [touch, setTouch] = useState(false);
  const levels = [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0] as const;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setTouch(window.matchMedia('(hover: none)').matches);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPlay('still'); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setPlay('1'); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="memory" className="section-memory">
      <div className="padding-vertical padding-panel">
        <div className="panel memory-panel">
          <div className="mk-container">
            <div className="memory-grid">
              <Reveal className="section-head">
                <span className="eyebrow-serif">{m.eyebrow}</span>
                <h2 className="h2-64">{m.headline}</h2>
                <p className="body-lead">{m.body}</p>
                <p className="body-note">{m.note}</p>
              </Reveal>
              <div ref={ref} className="scene scene-memory" data-play={play} role="img" aria-label="A small pool of buyers. A company update passes one buyer and nothing happens. A useful written idea passes and the buyer recognises the name; the judgement behind it, and the buyer remembers; a proof asset, and the buyer trusts; a trigger, and it is obvious who to call.">
                <span className="scene-label mm-field-label">{m.fieldLabel}</span>
                {levels.map((lvl, i) => {
                  const r = Math.floor(i / 4) + 1; const c = (i % 4) + 1;
                  if (i === 6) return <span key={i} className="buyer mm-buyer mm-target is-r2c3" />;
                  return <span key={i} className={`buyer mm-buyer is-r${r}c${c} is-l${lvl}`} />;
                })}
                <span className="mm-state" aria-hidden="true">
                  {m.encounters.map((e, i) => <span key={e.label} className={`is-${i + 1}`}>{e.label}</span>)}
                </span>
                {m.passes.map((p, i) => (
                  <div key={p.label} className={`mm-pass is-${i + 1}${p.reacts ? '' : ' is-ignored'}`} aria-hidden="true">
                    {p.kind === 'trigger'
                      ? <div className="obj is-vermilion token"><span className="dot" />{p.label}</div>
                      : p.kind === 'update'
                        ? <div className="frame is-update"><div className="frame-head"><span className="frame-avatar" /><span className="frame-kind">{p.label}</span></div><span className="frame-line is-w90" /><span className="frame-line is-w60" /></div>
                        : <Frame kind={p.kind} label={p.label} />}
                  </div>
                ))}
                <div className="mm-trace">
                  <div className="mm-trace-line" />
                  <div className="mm-trace-fill" />
                  <div className="mm-stamps">
                    {m.encounters.map((e, i) => (
                      <button
                        key={e.label}
                        type="button"
                        className={`mm-stamp is-${i + 1}`}
                        data-open={open === i ? 'true' : 'false'}
                        aria-expanded={open === i}
                        onClick={e => setOpen(o => (o === i && (e.detail === 0 || touch) ? null : i))}
                        onMouseEnter={() => { if (!touch) setOpen(i); }}
                        onMouseLeave={() => { if (!touch) setOpen(null); }}
                        onBlur={() => setOpen(o => (o === i ? null : o))}
                      >
                        <span className={`buyer is-l${i}`} aria-hidden="true" />
                        <span className="scene-label">{e.label}</span>
                        <small>{e.note}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
