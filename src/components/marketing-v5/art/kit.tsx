/**
 * THREADLINE v5: the illustration kit.
 *
 * Every public scene is drawn from these parts, in code, by hand. The grammar
 * is editorial rather than animated:
 *
 *   · one fine ink line (1.6 units) with square-ish corners; fills are flat
 *     and few: paper, a cool grey-blue, a warm parchment, one muted lilac;
 *   · people are faceless scale figures: a small head, a tapered body, single
 *     line limbs, no hands, no hair, no expressions;
 *   · the thread is two strokes, a hairline of ink under a marigold line, so
 *     it survives every background and stays the one warm accent;
 *   · labels are the site sans face, small and tracked, and only where a
 *     visitor needs a word to read the object. Every label is sized to fit
 *     its object (`Plate`, `Signal`, `Crate`, `Folder` measure themselves).
 *
 * All artwork here is original to Threadline. Nothing is traced, imported or
 * adapted from a reference site.
 */
import * as React from "react";

export const C = {
  ink: "var(--v5-ink)",
  paper: "var(--v5-paper)",
  paperDeep: "var(--v5-paper-deep)",
  night: "var(--v5-night)",
  white: "var(--v5-white)",
  sky: "var(--v5-sky)",
  skyDeep: "var(--v5-sky-deep)",
  mint: "var(--v5-mint)",
  mintDeep: "var(--v5-mint-deep)",
  coral: "var(--v5-coral)",
  coralDeep: "var(--v5-coral-deep)",
  lilac: "var(--v5-lilac)",
  lilacDeep: "var(--v5-lilac-deep)",
  butter: "var(--v5-butter)",
  gold: "var(--v5-gold)",
  navy: "var(--v5-navy)",
  navySoft: "var(--v5-navy-soft)",
  wood: "var(--v5-wood)",
  woodDeep: "var(--v5-wood-deep)",
} as const;

/** Kept for the design lab's older explorations; the figures no longer use skin tones. */
export const SKIN = ["#F3CDAE", "#D8A47F", "#A8744F", "#F7DCC6", "#8A5A3C"] as const;

type G = React.SVGProps<SVGGElement>;
/** The one line weight of the world. */
export const LINE = 1.6;
const O = { stroke: C.ink, strokeWidth: LINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Label metrics: 11-unit tracked capitals ≈ 7.1 units per character. */
export const CH = 7.1;
export const labelWidth = (text: string, pad = 22) => Math.round(text.length * CH + pad);

/** Place a group: translate, optional scale, flip and rotation. */
export function At({ x = 0, y = 0, s = 1, flip = false, r = 0, children, ...rest }: { x?: number; y?: number; s?: number; flip?: boolean; r?: number } & G) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`} {...rest}>
      {children}
    </g>
  );
}

/* ------------------------------------------------------------------ thread */

/** The Threadline: a marigold line over a hairline of ink. `draw` lets motion.css draw it once in view. */
export function Thread({ d, draw = false, thin = false, className = "", dashed = false }: { d: string; draw?: boolean; thin?: boolean; className?: string; dashed?: boolean }) {
  const w = thin ? 1.8 : 2.6;
  return (
    <g className={`v5-thread${draw ? " is-draw" : ""} ${className}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={C.ink} strokeWidth={w + 1.8} pathLength={1} />
      <path d={d} stroke={C.gold} strokeWidth={w} pathLength={1} strokeDasharray={dashed ? "0.012 0.02" : undefined} />
    </g>
  );
}

/** A knot on the thread: a bead where an encounter, a decision or a signal was tied in. */
export function Knot({ x, y, s = 1, tone = C.gold }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <circle r={6.5} fill={tone} {...O} />
      <circle r={2} fill={C.ink} />
    </At>
  );
}

/** A spool: the root thesis, wound. */
export function Spool({ x, y, s = 1, label, fill = C.gold }: { x: number; y: number; s?: number; label?: string; fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <rect x={-32} y={-44} width={64} height={10} rx={2} fill={C.wood} {...O} />
      <rect x={-24} y={-34} width={48} height={50} rx={2} fill={fill} {...O} />
      <path d="M-24 -24 H24 M-24 -14 H24 M-24 -4 H24 M-24 6 H24" stroke={C.ink} strokeWidth={1.2} opacity={0.45} />
      <rect x={-32} y={16} width={64} height={10} rx={2} fill={C.wood} {...O} />
      {label ? (
        <text x={0} y={46} textAnchor="middle" className="v5-label">
          {label}
        </text>
      ) : null}
    </At>
  );
}

/* ------------------------------------------------------------------ people */

export type PersonProps = {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  /** Body tone. */
  shirt?: string;
  /** Hand positions relative to the figure's origin (feet, centre). */
  armL?: [number, number];
  armR?: [number, number];
  sit?: boolean;
  /** A band across the body marking a Threadline operator. */
  apron?: string;
  className?: string;
};

/**
 * One faceless figure, ~150 units tall at s=1, origin at the feet. A scale
 * figure from an architectural drawing: a small head, a tapered body, limbs as
 * single lines. No hands, no hair, no face.
 */
export function Person({ x, y, s = 1, flip, shirt = C.lilac, armL = [-26, -64], armR = [26, -64], sit, apron, className = "v5-person" }: PersonProps) {
  const limb = { fill: "none", stroke: C.ink, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <At x={x} y={y} s={s} flip={flip} className={className}>
      {sit ? (
        <g {...limb}>
          <path d="M-6 -60 L24 -56 L26 -2" />
          <path d="M6 -60 L36 -54 L38 -2" />
        </g>
      ) : (
        <g {...limb}>
          <path d="M-8 -60 L-9 -2" />
          <path d="M8 -60 L9 -2" />
        </g>
      )}
      {/* far arm */}
      <path d={`M-15 -106 L${armL[0]} ${armL[1]}`} {...limb} />
      {/* body */}
      <path d="M-14 -118 Q-14 -124 -8 -124 H8 Q14 -124 14 -118 L19 -58 H-19 Z" fill={shirt} {...O} />
      {apron ? <path d="M-11 -100 H11 L15 -62 H-15 Z" fill={apron} {...O} /> : null}
      {/* neck and head */}
      <path d="M0 -124 V-129" stroke={C.ink} strokeWidth={LINE} />
      <circle cx={0} cy={-140} r={10.5} fill={C.paper} {...O} />
      {/* near arm */}
      <path d={`M15 -106 L${armR[0]} ${armR[1]}`} {...limb} />
    </At>
  );
}

/* --------------------------------------------------------------- artefacts */

export type ArtefactKind = "post" | "video" | "doc" | "proof" | "deep" | "diagnostic" | "nurture" | "update";

/** A native artefact, ~64 × 84 at s=1, origin at its centre. Each kind has its own silhouette. */
export function Artefact({ kind, x, y, s = 1, r = 0, tone, className }: { kind: ArtefactKind; x: number; y: number; s?: number; r?: number; tone?: string; className?: string }) {
  const rule = { stroke: C.ink, strokeWidth: 1.8, strokeLinecap: "round" as const };
  return (
    <At x={x} y={y} s={s} r={r} className={className}>
      {kind === "post" && (
        <g>
          <rect x={-32} y={-42} width={64} height={84} rx={3} fill={tone ?? C.white} {...O} />
          <rect x={-22} y={-32} width={12} height={12} rx={1} fill={C.sky} {...O} />
          <path d="M-4 -28 H20 M-4 -22 H12" {...rule} />
          <path d="M-22 -8 H22 M-22 2 H22 M-22 12 H22 M-22 22 H8" {...rule} opacity={0.55} />
        </g>
      )}
      {kind === "update" && (
        <g opacity={0.9}>
          <rect x={-32} y={-42} width={64} height={84} rx={3} fill={tone ?? C.paperDeep} {...O} />
          <path d="M-22 -24 H22 M-22 -12 H22 M-22 0 H22 M-22 12 H22 M-22 24 H4" {...rule} opacity={0.3} />
        </g>
      )}
      {kind === "video" && (
        <g>
          <rect x={-26} y={-46} width={52} height={92} rx={6} fill={C.navy} {...O} />
          <rect x={-21} y={-38} width={42} height={70} rx={2} fill={tone ?? C.sky} {...O} />
          <path d="M-6 -14 L10 -3 L-6 8 Z" fill={C.ink} />
        </g>
      )}
      {kind === "doc" && (
        <g>
          <rect x={-22} y={-34} width={64} height={80} rx={2} fill={C.paperDeep} {...O} />
          <rect x={-29} y={-40} width={64} height={80} rx={2} fill={C.paper} {...O} />
          <rect x={-36} y={-46} width={64} height={80} rx={2} fill={tone ?? C.white} {...O} />
          <rect x={-27} y={-36} width={46} height={24} rx={1} fill={C.sky} {...O} />
          <path d="M-27 -2 H18 M-27 8 H18 M-27 18 H4" {...rule} opacity={0.6} />
        </g>
      )}
      {kind === "proof" && (
        <g>
          <rect x={-32} y={-42} width={64} height={84} rx={3} fill={tone ?? C.white} {...O} />
          <path d="M-20 -26 H20 M-20 -16 H20 M-20 -6 H6" {...rule} opacity={0.55} />
          <circle cx={12} cy={22} r={12} fill={C.mint} {...O} />
          <path d="M6 22 L11 27 L19 17" fill="none" {...rule} strokeLinejoin="round" />
        </g>
      )}
      {kind === "deep" && (
        <g>
          <path d="M-36 -38 Q-18 -44 0 -36 Q18 -44 36 -38 V38 Q18 32 0 40 Q-18 32 -36 38 Z" fill={tone ?? C.lilac} {...O} />
          <path d="M0 -36 V40" stroke={C.ink} strokeWidth={LINE} />
          <path d="M-26 -22 Q-16 -25 -8 -21 M-26 -8 Q-16 -11 -8 -7 M8 -21 Q16 -25 26 -22 M8 -7 Q16 -11 26 -8 M8 7 Q16 3 26 6" fill="none" {...rule} opacity={0.55} />
        </g>
      )}
      {kind === "diagnostic" && (
        <g>
          <rect x={-32} y={-40} width={64} height={84} rx={3} fill={tone ?? C.wood} {...O} />
          <rect x={-25} y={-30} width={50} height={68} rx={1} fill={C.white} {...O} />
          <rect x={-12} y={-47} width={24} height={12} rx={2} fill={C.navySoft} {...O} />
          {[-16, 0, 16].map((yy) => (
            <g key={yy}>
              <rect x={-19} y={yy - 5} width={10} height={10} rx={1} fill={yy === 16 ? C.white : C.mint} {...O} />
              <path d={`M-3 ${yy} H18`} {...rule} opacity={0.6} />
            </g>
          ))}
        </g>
      )}
      {kind === "nurture" && (
        <g>
          <rect x={-38} y={-27} width={76} height={54} rx={2} fill={tone ?? C.paperDeep} {...O} />
          <path d="M-38 -24 L0 6 L38 -24" fill="none" {...O} />
          <circle cx={0} cy={12} r={6} fill={C.gold} {...O} />
        </g>
      )}
    </At>
  );
}

/** A peg on the line and the artefact hanging from it. Origin is the point on the thread. */
export function Pegged({ kind, x, y, r = 0, s = 1, tone }: { kind: ArtefactKind; x: number; y: number; r?: number; s?: number; tone?: string }) {
  return (
    <At x={x} y={y} r={r} s={s}>
      <Artefact kind={kind} x={0} y={kind === "nurture" ? 40 : 56} tone={tone} />
      <rect x={-4} y={-8} width={8} height={24} rx={1.5} fill={C.wood} {...O} />
    </At>
  );
}

/* ------------------------------------------------------------------- props */

export function Crate({ x, y, w = 110, h = 64, label, fill = C.wood, s = 1, r = 0 }: { x: number; y: number; w?: number; h?: number; label?: string; fill?: string; s?: number; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={2} fill={fill} {...O} />
      <path d={`M${-w / 2} ${-h + 12} H${w / 2}`} stroke={C.ink} strokeWidth={LINE} opacity={0.45} />
      {label ? (
        <text x={0} y={-h / 2 + 10} textAnchor="middle" className="v5-label" textLength={Math.min(w - 20, label.length * CH)} lengthAdjust="spacingAndGlyphs">
          {label}
        </text>
      ) : null}
    </At>
  );
}

export function PaperStack({ x, y, n = 4, w = 70, fill = C.white, s = 1 }: { x: number; y: number; n?: number; w?: number; fill?: string; s?: number }) {
  return (
    <At x={x} y={y} s={s}>
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={-w / 2 + ((i * 7) % 9) - 4} y={-9 - i * 8} width={w} height={9} rx={1} fill={i % 3 === 1 ? C.paperDeep : fill} {...O} />
      ))}
    </At>
  );
}

export function Folder({ x, y, fill = C.sky, label, s = 1, r = 0 }: { x: number; y: number; fill?: string; label?: string; s?: number; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <path d="M-52 -58 H-14 L-6 -50 H52 V0 H-52 Z" fill={fill} {...O} />
      <path d="M-52 -40 H52" stroke={C.ink} strokeWidth={LINE} opacity={0.45} />
      {label ? (
        <text x={0} y={-15} textAnchor="middle" className="v5-label is-xs" textLength={Math.min(88, label.length * 6.2)} lengthAdjust="spacingAndGlyphs">
          {label}
        </text>
      ) : null}
    </At>
  );
}

/** A binder on a shelf, spine out. */
export function Binder({ x, y, h = 70, w = 20, fill = C.lilac }: { x: number; y: number; h?: number; w?: number; fill?: string }) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} rx={1} fill={fill} {...O} />
      <rect x={x + 4} y={y - h + 10} width={w - 8} height={12} rx={0.5} fill={C.white} stroke={C.ink} strokeWidth={1.2} />
    </g>
  );
}

/** A gear, drawn still: mechanism, not motion. */
export function Gear({ x, y, r = 30, fill = C.lilac, teeth = 10, className }: { x: number; y: number; r?: number; fill?: string; teeth?: number; className?: string }) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (Math.PI * i) / teeth;
    const rr = i % 2 === 0 ? r : r * 0.8;
    const a2 = a + Math.PI / teeth / 2.4;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`, `${(Math.cos(a2) * rr).toFixed(1)},${(Math.sin(a2) * rr).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y})`} className={className}>
      <polygon points={pts.join(" ")} fill={fill} {...O} />
      <circle r={r * 0.3} fill={C.paper} {...O} />
    </g>
  );
}

export function Lamp({ x, y, s = 1, flip }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <At x={x} y={y} s={s} flip={flip}>
      <path d="M0 0 V-46 L30 -78" fill="none" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 -92 L52 -76 L40 -58 L14 -72 Z" fill={C.paperDeep} {...O} />
      <path d="M-18 0 H18" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />
    </At>
  );
}

export function Desk({ x, y, w = 200, fill = C.wood }: { x: number; y: number; w?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-64} width={w} height={10} rx={1} fill={fill} {...O} />
      <path d={`M${-w / 2 + 14} -54 V0 M${w / 2 - 14} -54 V0`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function Armchair({ x, y, s = 1, fill = C.lilac }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <path d="M-44 -112 Q-44 -124 -32 -124 H28 Q40 -124 40 -112 V-46 H-44 Z" fill={fill} {...O} />
      <rect x={-58} y={-70} width={22} height={50} rx={3} fill={fill} {...O} />
      <rect x={34} y={-70} width={22} height={50} rx={3} fill={fill} {...O} />
      <rect x={-40} y={-56} width={80} height={34} rx={2} fill={fill} {...O} />
      <path d="M-40 -20 V-4 M40 -20 V-4" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    </At>
  );
}

/** A small mark of attention: a ring with a point, never a star. */
export function Spark({ x, y, s = 1, tone = C.gold }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <circle r={7} fill="none" stroke={C.ink} strokeWidth={LINE} />
      <circle r={2.4} fill={tone} />
    </At>
  );
}

/** A commercial signal: a small marigold tag with a label. */
export function Signal({ x, y, label, s = 1 }: { x: number; y: number; label?: string; s?: number }) {
  const w = label ? labelWidth(label, 20) : 24;
  return (
    <At x={x} y={y} s={s}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={3} fill={C.gold} {...O} />
      {label ? (
        <text x={0} y={4} textAnchor="middle" className="v5-label is-ink">
          {label}
        </text>
      ) : null}
    </At>
  );
}

/** A label tag for a station, a room or a place. Sized to its text. */
export function Plate({ x, y, children, tone = C.paper, w }: { x: number; y: number; children: string; tone?: string; w?: number }) {
  const width = w ?? labelWidth(children);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-width / 2} y={-13} width={width} height={26} rx={3} fill={tone} {...O} />
      <text x={0} y={4} textAnchor="middle" className="v5-label is-ink">
        {children}
      </text>
    </g>
  );
}

/** Low-intensity paper grain, laid over a scene's fills. */
export function Grain({ id }: { id: string }) {
  return (
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.13  0 0 0 0 0.22  0 0 0 0.07 0" />
      </filter>
    </defs>
  );
}

export const outline = O;
