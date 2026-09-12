import { comparison } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * The work table — one tray per alternative, seven capability objects that
 * slide into place as the section enters. Nobody is made to look stupid:
 * the narrower jobs simply fill fewer slots; Threadline's tray ends with the
 * complete loop.
 */
export default function ComparisonSection() {
  const c = comparison;
  const slotClass = (v: number) => (v >= 1 ? 'slot is-full' : v > 0 ? 'slot is-half' : 'slot');
  return (
    <section id="comparison" className="section-comparison">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <Reveal className="section-head is-centered">
            <span className="eyebrow-serif">{c.eyebrow}</span>
            <h2 className="h2-64 is-centered">{c.headline}</h2>
            <p className="body-lead" style={{ textAlign: 'center' }}>{c.body}</p>
          </Reveal>
          <div className="compare" role="table" aria-label="Capability comparison">
            <div className="compare-head" role="row">
              <span className="label" role="columnheader">Alternative</span>
              {c.capabilities.map(cap => <span key={cap} className="label" role="columnheader">{cap}</span>)}
            </div>
            {c.rows.map((r, i) => (
              <Reveal key={r.label} className={`compare-row${'own' in r && r.own ? ' is-own' : ''}`} role="row" delay={i * 90}>
                <div className="compare-name" role="rowheader"><strong>{r.label}</strong><small>{r.note}</small></div>
                <div className="compare-slots" style={{ display: 'contents' }}>
                  {r.fill.map((v, j) => (
                    <span key={j} className={`${slotClass(v)} assemble`} style={{ ['--i' as string]: j + 1, ['--ay' as string]: '-26px', ['--as' as string]: 0.6 }} role="cell" aria-label={`${c.capabilities[j]}: ${v >= 1 ? c.legend.full : v > 0 ? c.legend.half : c.legend.empty}`} />
                  ))}
                </div>
              </Reveal>
            ))}
            <div className="compare-legend">
              <span><span className="slot is-full" />{c.legend.full}</span>
              <span><span className="slot is-half" />{c.legend.half}</span>
              <span><span className="slot" />{c.legend.empty}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
