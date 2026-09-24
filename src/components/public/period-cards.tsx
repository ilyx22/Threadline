import { Reveal } from "@/components/marketing/reveal";
import { PeriodTimeline } from "@/components/factory/schematic";

/**
 * Period cards: Threadline mutation of the frozen clone
 * `reference-analysis/clones/hydra-offer-cards` (see its FROZEN.md).
 *
 * Kept from the skeleton: the card column (eyebrow → title → body → sunk
 * diagram box → mono fact line), 12px surfaces with 1px borders, 32px padding,
 * 20px grid gap, 56px top margin, the 0.7s reveal easing.
 *
 * Threadline's: the four service-period cards' copy, unchanged; a twelve-week
 * timeline in the diagram box; the fact line names the weeks. The cards are
 * not links, so the skeleton's arrow link is omitted.
 */
export function PeriodCards({ periods }: { periods: readonly { label: string; title: string; body: string }[] }) {
  return (
    <ol className="tl-offer-grid">
      {periods.map((p, i) => (
        <Reveal key={p.label} delay={Math.min(i, 3) * 70} as="li">
          <div className="tl-offer-card" data-future={i >= 3 ? "true" : "false"}>
            <p className="tl-label text-[color:var(--accent-deep)]">{p.label}</p>
            <p className="tl-offer-title">{p.title}</p>
            <p className="tl-offer-body">{p.body}</p>
            <div className="tl-diagram-box">
              <PeriodTimeline period={i} />
            </div>
            <p className="tl-fact">{i >= 3 ? "Week 13 onwards · 4-week service periods" : `Weeks ${i * 4 + 1}–${i * 4 + 4} · one 4-week service period`}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
