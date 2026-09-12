import { closing } from '@/content/marketing-site';
import Reveal from './Reveal';
import { Arrow } from './Icons';
import { Frame } from './Frame';

/**
 * The final moment — the hero machine, evolved. A night panel that overlaps
 * into the ink footer. As it enters: the stack assembles, three expressions
 * move out into the market, buyers light in cobalt and vermilion, signals
 * return to the bench, and the stack gains one more layer. The system
 * compounds. Then the CTA.
 */
export default function ClosingSection() {
  const c = closing;
  const levels = [0, 2, 0, 4, 1, 0, 3, 0, 0, 4, 0, 2];
  return (
    <section id="closing" className="section-closing">
      <div className="padding-vertical padding-panel">
        <div className="panel closing-panel is-night">
          <div className="mk-container relative">
            <Reveal className="stack-32 closing-copy">
              <h2 className="closing-headline is-on-night">
                {c.headline[0]}
                <span className="is-soft">{c.headline[1]}</span>
              </h2>
              <p className="body-lead is-on-night">{c.body}</p>
              <div className="cta-flex">
                <a href={c.cta.href} className="button-primary is-lg is-paper">
                  <span>{c.cta.label}</span>
                  <Arrow />
                </a>
              </div>
              <div className="closing-outputs" aria-label="What the system produces">
                {c.outputs.map(o => <span key={o} className="token obj is-night-raised"><span className="dot" />{o}</span>)}
              </div>
            </Reveal>
          </div>
          <Reveal className="closing-scene-wrap" once>
            <div className="scene scene-closing" role="img" aria-label="The authority stack seen from a distance, one layer taller than in the hero; expressions move out into a field of buyers, more of whom have become familiar and some of whom are in conversation; signals return to the bench.">
              <div className="cl-bench" />
              {[1, 2, 3, 4, 5].map(i => <div key={i} className={`obj cl-slab is-${i} assemble`} style={{ ['--i' as string]: i, ['--ay' as string]: '30px' }} />)}
              <div className="obj is-cobalt cl-slab is-6 assemble" style={{ ['--i' as string]: 14, ['--ay' as string]: '-60px', ['--as' as string]: 0.9 }}>
                <span className="scene-label cl-taller">{c.taller}</span>
              </div>
              {levels.map((l, i) => <span key={i} className={`buyer cl-buyer is-${i + 1} is-l${l}`} style={{ ['--d' as string]: `${900 + i * 140}ms` }} />)}
              <div className="cl-frame is-1 assemble" style={{ ['--i' as string]: 7, ['--ax' as string]: '-220px', ['--ay' as string]: '-90px', ['--as' as string]: 0.6 }}><Frame kind="post" label="Written" /></div>
              <div className="cl-frame is-2 assemble" style={{ ['--i' as string]: 8, ['--ax' as string]: '-300px', ['--ay' as string]: '-110px', ['--as' as string]: 0.6 }}><Frame kind="video" label="Video" /></div>
              <div className="cl-frame is-3 assemble" style={{ ['--i' as string]: 9, ['--ax' as string]: '-380px', ['--ay' as string]: '-90px', ['--as' as string]: 0.6 }}><Frame kind="doc" label="Document" /></div>
              <span className="cl-return signal-loop" style={{ ['--d' as string]: '2.4s', ['--sx0' as string]: '560px', ['--sy0' as string]: '150px', ['--sx1' as string]: '120px', ['--sy1' as string]: '470px' }} aria-hidden="true" />
              <span className="cl-return signal-loop" style={{ ['--d' as string]: '6.4s', ['--sx0' as string]: '600px', ['--sy0' as string]: '300px', ['--sx1' as string]: '160px', ['--sy1' as string]: '470px' }} aria-hidden="true" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
