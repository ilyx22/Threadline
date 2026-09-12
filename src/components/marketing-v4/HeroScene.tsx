'use client';

import { useEffect, useRef, useState } from 'react';
import { hero } from '@/content/marketing-site';
import { Frame } from './Frame';

/**
 * SIGNATURE ANIMATION #1 — THE AUTHORITY STACK.
 *
 * A single CSS timeline (styles/hero-choreo.css), started once when the scene
 * is in view, in six beats:
 *   1  five expertise cards enter from different directions and settle into a
 *      loose pile;
 *   2  a cobalt signal token arrives and docks; the pile aligns; AUTHORITY
 *      appears on top;
 *   3  three expression cards peel out of the top of the stack;
 *   4  two pieces travel to one buyer: stranger → recognise → remember;
 *   5  vermilion commercial signals appear beside the buyer;
 *   6  a signal returns to the bench and the loop closes; two return signals
 *      keep looping slowly afterwards.
 *
 * Reduced motion, and before the timeline starts on a reload, the final
 * composition is shown. Nothing essential needs hover: hover lifts a card,
 * shows a frame's format, and reveals what a signal means.
 */
export default function HeroScene() {
  const s = hero.scene;
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPlay(-1); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setPlay(p => (p === 0 ? 1 : p)); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const replay = () => { setPlay(0); requestAnimationFrame(() => requestAnimationFrame(() => setPlay(p => p + 2))); };

  return (
    <div ref={ref} className="hero-scene" data-play={play === 0 ? '0' : play === -1 ? 'still' : '1'} key={play}>
      <div className="scene scene-stack" role="img" aria-label="Five blocks of raw expertise settle into a stack. A market signal docks and the stack becomes authority. Three expressions peel off it and reach one buyer, who goes from stranger to recognise to remember. Commercial signals appear beside the buyer, and a signal returns to the bench.">
        <svg className="scene-path" viewBox="0 0 760 640" preserveAspectRatio="none" aria-hidden="true">
          <path className="is-cobalt hc-path-out" d="M 236 236 C 300 236, 330 150, 372 120" />
          <path className="is-cobalt hc-path-out" d="M 236 300 C 300 320, 330 400, 366 440" />
          <path className="is-steel hc-path-back" d="M 690 190 C 730 420, 600 570, 180 592" />
        </svg>

        {/* BEAT 1 — expertise arrives */}
        {s.blocks.map((b, i) => (
          <div key={b} className={`hc-card is-${i + 1}`} title={`Raw expertise: ${b.toLowerCase()}`}>
            <div className="obj token hc-card-in"><span className="dot" />{b}</div>
          </div>
        ))}

        {/* BEAT 2 — market signal docks; authority appears */}
        <div className="obj is-cobalt token hc-dock" aria-hidden="true"><span className="dot" />Buyer question</div>
        <div className="obj is-cobalt hc-authority"><span className="token">{s.stackLabel}</span></div>

        {/* BEAT 3 — expressions peel */}
        {s.frames.map((f, i) => (
          <div key={f.label} className={`hc-frame is-${i + 1}`}>
            <Frame kind={f.kind} label={f.label} />
            <span className="hc-format label">{f.kind === 'post' ? 'Written' : f.kind === 'video' ? 'Video' : 'Document'}</span>
          </div>
        ))}

        {/* BEAT 4 — pieces travel to the buyer; the buyer remembers */}
        <span className="scene-label hc-field-label">{s.buyers}</span>
        <span className="hc-piece is-1" aria-hidden="true" />
        <span className="hc-piece is-2" aria-hidden="true" />
        {[0, 1, 0, 3, 1].map((level, i) => <span key={i} className={`buyer hc-buyer is-${i + 1} is-l${level}`} />)}
        <span className="buyer hc-target" />
        <span className="hc-state" aria-hidden="true">
          <span className="is-1">Stranger</span><span className="is-2">Recognise</span><span className="is-3">Remember</span>
        </span>

        {/* BEAT 5 — commercial signals */}
        <div className="obj is-vermilion token hc-signal is-1" title="A relevant buyer visited the profile"><span className="dot" />Profile visit</div>
        <div className="obj is-vermilion token hc-signal is-2" title="A buyer asked by name — the strongest signal content creates"><span className="dot" />Named enquiry</div>

        {/* BEAT 6 — the return */}
        <span className="hc-return" aria-hidden="true" />
        <span className="hc-return is-loop is-a" aria-hidden="true" />
        <span className="hc-return is-loop is-b" aria-hidden="true" />

        <div className="sc-bench"><span className="scene-label">Raw expertise in · signals back</span></div>
      </div>
      <button type="button" className="hc-replay" onClick={replay} aria-label="Replay the hero animation">↺ Replay</button>
    </div>
  );
}
