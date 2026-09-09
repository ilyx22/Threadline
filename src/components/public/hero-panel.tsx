import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Eyebrow, Mark, PublicButton } from "@/components/public/primitives";

/**
 * Hero panel — Threadline mutation of the frozen clone
 * `reference-analysis/clones/birdhouse-hero-panel` (see its FROZEN.md).
 *
 * Kept from the skeleton: one rounded paper panel on the canvas, 80/30/24
 * section padding, a statement column of ~560px with 32px gaps, a pill CTA,
 * the illustration anchored bottom-right and allowed to run off the panel edge,
 * stacking to a centred column below 992px.
 *
 * Threadline's: every word (unchanged from the previous hero), Fraunces /
 * Inter / JetBrains Mono, the linen-and-paper palette, the schematic line art.
 */
export function HeroPanel({ eyebrow, title, lead, sub, note, primary, secondary, art }: { eyebrow: string; title: readonly [string, string]; lead: string; sub: string; note: string; primary: { label: string; href: string }; secondary: { label: string; href: string }; art: ReactNode }) {
  return (
    <section className="tl-hero-pad">
      <div className="tl-hero-panel">
        <div className="tl-hero-inner">
          <div className="tl-hero-text">
            <Eyebrow className="mb-0">{eyebrow}</Eyebrow>
            <h1 className="tl-display">
              {title[0]}
              <br />
              <Mark>{title[1]}</Mark>
            </h1>
            <p className="tl-lead">{lead}</p>
            <p className="text-[17px] font-medium text-[color:var(--ink)]">{sub}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <PublicButton href={primary.href} primary size="lg">
                {primary.label}
                <ArrowRight className="size-5" aria-hidden />
              </PublicButton>
              <PublicButton href={secondary.href} size="lg">
                {secondary.label}
              </PublicButton>
            </div>
            <p className="max-w-md text-[14px] leading-relaxed text-[color:var(--ink-faint)]">{note}</p>
          </div>
        </div>
        <div className="tl-hero-art" aria-hidden>
          {art}
        </div>
      </div>
    </section>
  );
}
