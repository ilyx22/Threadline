import { Reveal } from "@/components/marketing/reveal";
import { BuyerAvatar, ThesisCard } from "@/components/factory/objects";

/**
 * Market memory: a small pool of the right buyers, and the same buyer meeting
 * the founder's thinking five times. Familiarity fills the ring; nothing
 * claims a number of exposures.
 */
export function BuyerPool({ stages, poolLabel, encountersLabel, cards }: { stages: readonly string[]; poolLabel: string; encountersLabel: string; cards: readonly string[] }) {
  const levels: (0 | 1 | 2 | 3 | 4)[] = [0, 1, 0, 2, 4, 1, 0, 3, 0];
  return (
    <div className="tl-pool">
      <Reveal className="tl-pool-stage">
        <p className="tl-label">{poolLabel}</p>
        <div className="tl-pool-grid mt-5" aria-hidden>
          {levels.map((l, i) => (
            <BuyerAvatar key={i} level={l} size={52} />
          ))}
        </div>
        <div className="tl-pool-card tl-pool-card-1" aria-hidden>
          <ThesisCard title={cards[0]} label="Piece" compact lines={1} />
        </div>
        <div className="tl-pool-card tl-pool-card-2" aria-hidden>
          <ThesisCard title={cards[1]} label="Piece" compact lines={1} />
        </div>
      </Reveal>
      <Reveal>
        <p className="tl-label">{encountersLabel}</p>
        <ol className="tl-encounters">
          {stages.map((s, i) => (
            <li key={s} className={`tl-encounter ${i === stages.length - 1 ? "tl-encounter-last" : ""}`}>
              <BuyerAvatar level={Math.min(4, i) as 0 | 1 | 2 | 3 | 4} label={`${s}: familiarity ${i} of 4`} />
              <span className="tl-encounter-name">{s}</span>
              <span className="tl-label">{String(i + 1).padStart(2, "0")}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </div>
  );
}
