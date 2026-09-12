import { hero } from '@/content/marketing-site';
import Reveal from './Reveal';
import { Arrow } from './Icons';
import HeroScene from './HeroScene';

/**
 * Hero — the reference's mechanic (a rounded paper panel, a statement column,
 * a scene that runs off the panel's lower-right edge) carrying Threadline's
 * signature scene, THE AUTHORITY STACK (components/HeroScene.tsx).
 */
export default function Hero() {
  return (
    <section className="section-hero">
      <div className="padding-vertical padding-hero">
        <div className="hero-wrapper">
          <div className="mk-container relative">
            <Reveal className="stack-32 is-hero hero-copy" once>
              <div className="stack-16">
                <div className="eyebrow-serif">{hero.eyebrow}</div>
                <h1 className="h1-88">{hero.headline}</h1>
              </div>
              <p className="hero-text">{hero.body}</p>
              <div className="cta-flex">
                <a href={hero.cta.href} className="button-primary is-lg is-arrow">
                  <span>{hero.cta.label}</span>
                  <Arrow />
                </a>
                <a href={hero.secondary.href} className="button-secondary is-lg">
                  <span>{hero.secondary.label}</span>
                  <Arrow />
                </a>
              </div>
            </Reveal>
          </div>
          <div className="hero-scene-wrap">
            <HeroScene />
          </div>
        </div>
      </div>
    </section>
  );
}
