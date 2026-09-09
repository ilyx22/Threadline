import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * THE AUTHORITY FACTORY — object language (v3, the captivation pass).
 *
 * The line diagrams explained structure; these objects explain transformation.
 * Everything a visitor sees moving through the system is one of these: a
 * token of expertise, a signal chip, a root-thesis card, a native content
 * tile, a response marker, a score card, a chamber that things pass through.
 * Filled shapes, soft 2.5D depth (a hairline, an ambient shadow and a 3px
 * darker bottom edge), a controlled palette, no glass and no glow.
 *
 * All HTML + CSS (classes in public.css under "Objects"); no canvas, no
 * animation library. Server-safe; motion is applied by parents.
 */

type Tone = "paper" | "ember" | "signal" | "ink" | "canvas" | "stamp";

export function Obj({ tone = "paper", className, children, style, as: Tag = "div", ...rest }: { tone?: Tone; className?: string; children?: ReactNode; style?: CSSProperties; as?: "div" | "li" | "button" | "span" } & Record<string, unknown>) {
  return (
    <Tag className={cn("tl-obj", `tl-obj-${tone}`, className)} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/** A token: a small filled pill carrying one word — expertise, a signal, an output. */
export function Token({ label, tone = "ember", icon, className }: { label: string; tone?: Tone; icon?: ReactNode; className?: string }) {
  return (
    <span className={cn("tl-token", `tl-obj-${tone}`, className)}>
      {icon ? <span className="tl-token-icon" aria-hidden>{icon}</span> : null}
      {label}
    </span>
  );
}

/** A market-signal chip: dot + short label; attaches to a thesis. */
export function SignalChip({ label, className, tone = "signal" }: { label: string; className?: string; tone?: "signal" | "ember" | "ink" }) {
  return (
    <span className={cn("tl-signal", `tl-signal-${tone}`, className)}>
      <span className="tl-signal-dot" aria-hidden />
      {label}
    </span>
  );
}

/** The root-thesis card: a coloured header band, a title and body lines. */
export function ThesisCard({ label = "Root thesis", title, lines = 3, className, compact, children }: { label?: string; title: string; lines?: number; className?: string; compact?: boolean; children?: ReactNode }) {
  return (
    <div className={cn("tl-obj tl-obj-paper tl-thesis", compact && "tl-thesis-compact", className)}>
      <div className="tl-thesis-band">
        <span className="tl-label text-[color:var(--paper)] opacity-90">{label}</span>
      </div>
      <p className="tl-thesis-title">{title}</p>
      {children ?? (
        <div className="tl-lines" aria-hidden>
          {Array.from({ length: lines }).map((_, i) => (
            <span key={i} className="tl-line" style={{ width: `${88 - i * 14}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

export type TileKind = "linkedin" | "video" | "x" | "threads" | "carousel" | "newsletter" | "post";

/** A native content tile: a simplified, original mock of how a piece looks on its platform. No logos. */
export function ContentTile({ kind, label, excerpt, className, muted }: { kind: TileKind; label: string; excerpt?: string; className?: string; muted?: boolean }) {
  return (
    <div className={cn("tl-obj tl-obj-paper tl-tile", `tl-tile-${kind}`, muted && "tl-tile-muted", className)} role="img" aria-label={`${label}${excerpt ? `: ${excerpt}` : ""}`}>
      <div className="tl-tile-head">
        {kind === "video" ? null : <span className="tl-tile-avatar" aria-hidden />}
        <span className="tl-tile-name" aria-hidden />
        <span className="tl-tile-kind">{label}</span>
      </div>
      {kind === "video" ? (
        <div className="tl-tile-frame" aria-hidden>
          <span className="tl-tile-play" />
          <span className="tl-tile-caption">{excerpt ? excerpt.slice(0, 48) : ""}</span>
        </div>
      ) : kind === "carousel" ? (
        <div className="tl-tile-pages" aria-hidden>
          <span className="tl-tile-page" />
          <span className="tl-tile-page" />
          <span className="tl-tile-page">
            <span className="tl-tile-page-text">{excerpt}</span>
          </span>
        </div>
      ) : (
        <p className="tl-tile-text">{excerpt}</p>
      )}
      <div className="tl-tile-foot" aria-hidden>
        <span className="tl-tile-react" />
        <span className="tl-tile-react" />
        <span className="tl-tile-react" />
      </div>
    </div>
  );
}

/** A buyer response: a teal marker with a short label (a comment, a profile visit, an enquiry). */
export function ResponseMarker({ label, className, kind = "reply" }: { label: string; className?: string; kind?: "reply" | "profile" | "enquiry" | "call" }) {
  return (
    <span className={cn("tl-response", `tl-response-${kind}`, className)}>
      <span className="tl-response-icon" aria-hidden>
        {kind === "reply" ? "↩" : kind === "profile" ? "◉" : kind === "enquiry" ? "✉" : "☎"}
      </span>
      {label}
    </span>
  );
}

/** A score card: the expected / actual reading of a piece. */
export function ScoreCard({ label, value, tone = "paper", className, children }: { label: string; value?: string; tone?: Tone; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("tl-obj tl-score", `tl-obj-${tone}`, className)}>
      <span className="tl-label">{label}</span>
      {value ? <span className="tl-score-value">{value}</span> : null}
      {children}
    </div>
  );
}

/** A chamber: a module that objects pass through, with a label tab and an optional founder badge. */
export function Chamber({ label, index, founder, active, className, children, onClick, id }: { label: string; index?: string; founder?: string; active?: boolean; className?: string; children?: ReactNode; onClick?: () => void; id?: string }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag id={id} type={onClick ? "button" : undefined} onClick={onClick} aria-pressed={onClick ? active : undefined} className={cn("tl-chamber", active && "tl-chamber-active", className)}>
      <span className="tl-chamber-tab">
        {index ? <span className="tl-chamber-index">{index}</span> : null}
        <span className="tl-chamber-label">{label}</span>
        {founder ? <span className="tl-founder-badge">You · {founder}</span> : null}
      </span>
      <span className="tl-chamber-body">{children}</span>
    </Tag>
  );
}

/** A small module tile (one job Threadline does). */
export function ModuleTile({ label, className, tone = "paper", style }: { label: string; className?: string; tone?: Tone; style?: CSSProperties }) {
  return (
    <span className={cn("tl-module", `tl-obj-${tone}`, className)} style={style}>
      {label}
    </span>
  );
}

/** A large output tile for the closing section. */
export function OutputTile({ label, className, tone = "paper", style }: { label: string; className?: string; tone?: Tone; style?: CSSProperties }) {
  return (
    <span className={cn("tl-obj tl-output", `tl-obj-${tone}`, className)} style={style}>
      <span className="tl-output-mark" aria-hidden />
      {label}
    </span>
  );
}

/** A buyer avatar: a filled silhouette whose ring fills as familiarity grows (0–4). */
export function BuyerAvatar({ level = 0, className, size = 44, label }: { level?: 0 | 1 | 2 | 3 | 4; className?: string; size?: number; label?: string }) {
  return (
    <span className={cn("tl-buyer", className)} data-level={level} style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 44 44" width={size} height={size}>
        <circle cx="22" cy="22" r="20" className="tl-buyer-ring" />
        <circle cx="22" cy="22" r="20" className="tl-buyer-fill" />
        <circle cx="22" cy="17" r="6.5" className="tl-buyer-head" />
        <path d="M10 36c1-7 6-10 12-10s11 3 12 10" className="tl-buyer-body" />
      </svg>
    </span>
  );
}

/** A filled check / cross tile for the fit section. */
export function VerdictTile({ yes, children, className }: { yes: boolean; children: ReactNode; className?: string }) {
  return (
    <li className={cn("tl-verdict", yes ? "tl-verdict-yes" : "tl-verdict-no", className)}>
      <span className="tl-verdict-mark" aria-hidden>
        {yes ? "✓" : "✕"}
      </span>
      <span>{children}</span>
    </li>
  );
}
