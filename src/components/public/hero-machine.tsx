import { ContentTile, ResponseMarker, SignalChip, ThesisCard, Token, type TileKind } from "@/components/factory/objects";

/**
 * The miniature Authority Machine that sits in the hero panel.
 *
 * One expertise token receives three market signals, becomes a root thesis,
 * fans into three native expressions, draws two buyer responses, and the
 * learning module sends the reading back to the start. A twelve-second CSS
 * sequence (transform + opacity, per-element delays) plays it; below 992px
 * the same objects stack into a vertical sequence, and under reduced motion
 * the finished state is shown. Nothing here is a claim: the texts are the
 * illustrative thesis used across the site.
 */
export function HeroMachine({ m }: { m: { token: string; signals: readonly string[]; thesis: string; outputs: readonly { kind: string; label: string; excerpt: string }[]; responses: readonly string[]; learn: string } }) {
  return (
    <div className="tl-machine" role="img" aria-label="Your expertise receives market signals, becomes a root thesis, becomes native content, draws buyer responses, and the reading feeds the next cycle">
      <svg className="tl-machine-paths" viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden>
        <path d="M110 262 C 190 262, 200 230, 270 230" />
        <path d="M110 262 C 200 262, 220 240, 270 236" />
        <path d="M560 250 C 610 250, 600 60, 660 60" />
        <path d="M560 250 C 600 250, 610 240, 660 240" />
        <path d="M560 260 C 610 260, 600 420, 660 420" />
        <path className="is-return" d="M600 470 C 500 500, 300 520, 120 460" />
      </svg>
      <div className="tl-mc tl-mc-token" style={{ ["--d" as string]: "0.2s" }}>
        <Token label={m.token} tone="ember" />
      </div>
      <div className="tl-mc tl-mc-signals" style={{ ["--d" as string]: "1.1s" }}>
        {m.signals.map((s) => (
          <SignalChip key={s} label={s} />
        ))}
      </div>
      <div className="tl-mc tl-mc-thesis" style={{ ["--d" as string]: "2.2s" }}>
        <ThesisCard title={m.thesis} label="Root thesis" compact lines={2} />
      </div>
      {m.outputs.map((o, i) => (
        <div key={o.label} className={`tl-mc tl-mc-tile-${i + 1}`} style={{ ["--d" as string]: `${3.4 + i * 0.5}s` }}>
          <ContentTile kind={o.kind as TileKind} label={o.label} excerpt={o.excerpt} />
        </div>
      ))}
      <div className="tl-mc tl-mc-resp-1" style={{ ["--d" as string]: "5.4s" }}>
        <ResponseMarker label={m.responses[0]} kind="profile" />
      </div>
      <div className="tl-mc tl-mc-resp-2" style={{ ["--d" as string]: "6s" }}>
        <ResponseMarker label={m.responses[1]} kind="enquiry" />
      </div>
      <div className="tl-mc tl-mc-learn" style={{ ["--d" as string]: "7s" }}>
        <span className="tl-obj tl-obj-ink">
          <span className="tl-loop-mark" aria-hidden>
            ↺
          </span>
          {m.learn}
        </span>
      </div>
    </div>
  );
}
