import { movement } from '@/content/marketing-site';
import Reveal from './Reveal';

/**
 * Attention → commercial movement — a physical staircase, not a funnel. Five
 * plates descend from right-buyer attention to an opportunity recorded with
 * its evidence class. One signal travels the path and is transformed at each
 * plate: an anonymous dot → an identifiable visitor (ring) → a response
 * (cobalt) → a person (paper with a cobalt ring) → an opportunity (vermilion).
 * It loops slowly while the scene is on screen and rests when it is not.
 */
export default function MovementSection() {
  const m = movement;
  const tones = ['is-steel-soft', 'is-mist', 'is-mist', 'is-cobalt-soft', 'is-cobalt'];
  return (
    <section id="movement" className="section-movement">
      <div className="padding-vertical padding-section">
        <div className="mk-container">
          <div className="movement-grid">
            <Reveal className="scene scene-movement" role="img" aria-label="Five descending plates: right-buyer attention, proof and profile, response or permission, human conversation, opportunity. One signal travels down them and changes at each step.">
              {m.steps.map((s, i) => (
                <div key={s.label} className={`obj ${tones[i]} mv-plate is-${i + 1} assemble`} style={{ ['--i' as string]: i, ['--ax' as string]: '-30px', ['--ay' as string]: '10px' }}>
                  <span className="token"><span className="dot" />{String(i + 1).padStart(2, '0')} · {s.label}</span>
                </div>
              ))}
              <span className="mv-token" aria-hidden="true" />
              <span className="mv-stamp assemble" style={{ ['--i' as string]: 6, ['--as' as string]: 0.7 }}>Evidence class · confirmed</span>
            </Reveal>
            <Reveal className="section-head">
              <span className="eyebrow-serif">{m.eyebrow}</span>
              <h2 className="h2-64">{m.headline}</h2>
              <p className="body-lead">{m.body}</p>
              <p className="body-note">{m.honesty}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
