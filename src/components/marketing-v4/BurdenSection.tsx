import { burden } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * Founder burden — intentional contrast. Four calm paper slabs on the night
 * band; Threadline's machinery moving quietly around them: the twelve things
 * it handles run along the band's edges as two slow marquees, and, as the
 * stage reveals, a messy pile of operational work approaches the founder and
 * is swept up into the machinery. What remains: TALK · RECORD · APPROVE · SELL.
 */
function Strip({ items, reverse }: { items: readonly string[]; reverse?: boolean }) {
  const track = [...items, ...items];
  return (
    <div className={`burden-edge${reverse ? ' is-reverse' : ''}`} aria-hidden="true">
      <div className="burden-edge-track">
        {track.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

export default function BurdenSection() {
  const b = burden;
  return (
    <section id="burden" className="section-burden band-night">
      <Strip items={b.ring.slice(0, 6)} />
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <Reveal className="section-head burden-head">
            <span className="eyebrow-serif is-on-night">{b.eyebrow}</span>
            <h2 className="h2-64 is-on-night">{b.headline}</h2>
          </Reveal>
          <Reveal className="burden-stage" once>
            {b.you.map((y, i) => (
              <div key={y.verb} className={`obj burden-slab is-${i + 1} assemble`} style={{ ['--i' as string]: i, ['--ay' as string]: '36px' }}>
                <span className="burden-verb">{y.verb}</span>
                <span className="burden-note">{y.note}</span>
                <span className="burden-index">0{i + 1}</span>
              </div>
            ))}
            <p className="burden-frame-label label">{b.frameLabel}</p>
            <div className="burden-pile" aria-hidden="true">
              {b.pile.map((t, i) => (
                <span key={t} className={`obj is-mist token burden-chip is-${i + 1}`}>{t}</span>
              ))}
            </div>
          </Reveal>
          <Reveal as="p" className="burden-relief is-on-night">{b.relief}</Reveal>
        </div>
      </div>
      <Strip items={b.ring.slice(6, 12)} reverse />
    </section>
  );
}
