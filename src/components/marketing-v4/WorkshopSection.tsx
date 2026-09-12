'use client';

import { useEffect, useState } from 'react';
import { workshop } from '@/content/marketing-site';
import Reveal from './Reveal';
import { Frame } from './Frame';

/**
 * The Authority Workshop — six tactile workstations on the reference's mosaic.
 * Each station has a rest composition and a 1.5–2.5s micro-story that runs
 * while it is active: hover (pointer devices) or tap (touch), one at a time.
 * Activating a station lifts it and recedes its neighbours; the one-sentence
 * explanation opens beneath the title. Keyboard: Tab to a station, Enter/Space
 * to run it. The stories live in styles/scenes.css (container-unit offsets,
 * transitions that reverse cleanly).
 */
function Scene({ k }: { k: string }) {
  switch (k) {
    case 'intel':
      return (
        <div className="wk-scene" aria-hidden="true">
          {['questions', 'objections', 'gaps'].map((t, i) => (
            <div key={t} className={`wk-bin is-${i + 1}`}><span className="scene-label">{t}</span></div>
          ))}
          {['buyer question', 'objection', 'search', 'competitor gap', 'pricing worry', 'trigger event', 'language'].map((t, i) => (
            <div key={t} className={`obj is-steel token wk-sig is-${i + 1}`}><span className="dot" />{t}</div>
          ))}
        </div>
      );
    case 'thesis':
      return (
        <div className="wk-scene" aria-hidden="true">
          {['call note', 'a pattern', 'objection', 'method step', 'proposal line', 'what failed', 'client words', 'a number', 'judgement'].map((t, i) => (
            <div key={t} className={`obj is-mist token wk-frag is-${i + 1}`}>{t}</div>
          ))}
          <div className="obj wk-thesis">
            <div className="thesis-band"><span className="label">Root thesis</span></div>
            <div className="thesis-body">One argument worth testing.</div>
          </div>
        </div>
      );
    case 'express':
      return (
        <div className="wk-scene" aria-hidden="true">
          {(['post', 'video', 'doc', 'proof'] as const).map((k2, i) => (
            <div key={k2} className={`obj wk-fan is-${i + 1}`}><Frame kind={k2} label={k2 === 'post' ? 'Written' : k2 === 'video' ? 'Video' : k2 === 'doc' ? 'Document' : 'Proof'} /></div>
          ))}
          <div className="obj wk-thesis is-source">
            <div className="thesis-band"><span className="label">Root thesis</span></div>
            <div className="thesis-body">One idea.</div>
          </div>
        </div>
      );
    case 'distribute':
      return (
        <div className="wk-scene" aria-hidden="true">
          <div className="obj wk-out is-1"><Frame kind="post" label="Piece" /></div>
          <div className="obj wk-out is-2"><Frame kind="video" label="Piece" /></div>
          <div className="wk-door" />
          {[true, false, true, false, true, false].map((lit, i) => <span key={i} className={`buyer wk-fb is-${i + 1}${lit ? ' is-lit' : ''}`} />)}
        </div>
      );
    case 'signal':
      return (
        <div className="wk-scene" aria-hidden="true">
          <div className="wk-tray"><span className="scene-label">Evidence tray</span></div>
          {['profile visit', 'named enquiry', 'asset request'].map((t, i) => (
            <div key={t} className={`obj is-vermilion token wk-ret is-${i + 1}`}><span className="dot" />{t}</div>
          ))}
          <span className="wk-receipt">Receipt · named enquiry · confirmed by the buyer</span>
        </div>
      );
    case 'learn':
      return (
        <div className="wk-scene" aria-hidden="true">
          <div className="wk-gauge is-exp" />
          <div className="wk-gauge is-act" />
          <span className="scene-label wk-gauge-label is-exp">Expected</span>
          <span className="scene-label wk-gauge-label is-act">Actual</span>
          <div className="obj is-night-raised wk-verdict">
            <span className="label">Why</span>
            <strong>Idea held. Hook failed.</strong>
          </div>
          <div className="obj token wk-hook is-fixed">Hook</div>
          <div className="wk-lever-base" />
          <div className="wk-lever" />
          <div className="obj token wk-change">One change · retest</div>
        </div>
      );
    default:
      return null;
  }
}

export default function WorkshopSection() {
  const w = workshop;
  const [active, setActive] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  const enter = (k: string) => { if (!touch) setActive(k); };
  const leave = () => { if (!touch) setActive(null); };
  /** Click keeps a hovered station running; a keyboard press (detail 0) or a tap on a touch device toggles it. */
  const press = (k: string, viaKeyboard: boolean) => setActive(a => (a === k && (viaKeyboard || touch) ? null : k));

  let n = 0;
  return (
    <section id="workshop" className="section-workshop">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <div className="gap-32-center">
            <Reveal className="section-head is-centered is-wide">
              <span className="eyebrow-serif">{w.eyebrow}</span>
              <h2 className="h2-64 is-centered">{w.headline}</h2>
              <p className="body-lead" style={{ textAlign: 'center' }}>{w.body}</p>
            </Reveal>
            <div className="workshop-item">
              <div className="workshop-grid" data-hover={active ? 'true' : 'false'}>
                {w.rows.map((row, r) => (
                  <div className="workshop-row" key={r}>
                    {row.map(tile => {
                      n += 1;
                      const idx = String(n).padStart(2, '0');
                      const isActive = active === tile.key;
                      return (
                        <Reveal
                          key={tile.key}
                          className={`wk-tile is-${tile.size} tone-${tile.tone}`}
                          data-active={isActive ? 'true' : 'false'}
                          onMouseEnter={() => enter(tile.key)}
                          onMouseLeave={leave}
                          onFocus={(e: React.FocusEvent) => { if ((e.target as HTMLElement).matches(':focus-visible')) setActive(tile.key); }}
                          onBlur={(e: React.FocusEvent) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setActive(a => (a === tile.key ? null : a)); }}
                        >
                          <Scene k={tile.key} />
                          <button type="button" className="wk-toggle" aria-expanded={isActive} aria-controls={`wk-plain-${tile.key}`} onClick={e => press(tile.key, e.detail === 0)}>
                            <span className="sr-only">{isActive ? 'Stop' : 'Run'} the {tile.title} station</span>
                          </button>
                          <div className="wk-heading">
                            <span className="wk-index">{idx}</span>
                            <h3 className="h3-28">{tile.title}</h3>
                            <p className="wk-plain" id={`wk-plain-${tile.key}`}>{tile.plain}</p>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                ))}
              </div>
              <Reveal as="p" className="wk-loop">↺ {w.loop}</Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
