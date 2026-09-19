/**
 * THREADLINE v5 — the illustration kit.
 *
 * Every public scene is drawn from these parts, in code, by hand: people with
 * faces, paper, crates, machines and the one continuous thread. The grammar:
 *
 *   · filled shapes, a 3-unit ink outline with round joins, flat pastel fills;
 *   · limbs are a thick ink stroke with a coloured stroke on top, so they read
 *     as outlined at any angle;
 *   · the thread is always two strokes — ink underneath, marigold on top — so
 *     it survives every background;
 *   · labels are set in the mono label face, ≥ 15 units, and only where a
 *     visitor needs a word to read the object.
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

export const SKIN = ["#F3CDAE", "#D8A47F", "#A8744F", "#F7DCC6", "#8A5A3C"] as const;

type G = React.SVGProps<SVGGElement>;
const O = { stroke: C.ink, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Place a group: translate, optional scale, flip and rotation. */
export function At({ x = 0, y = 0, s = 1, flip = false, r = 0, children, ...rest }: { x?: number; y?: number; s?: number; flip?: boolean; r?: number } & G) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`} {...rest}>
      {children}
    </g>
  );
}

/* ------------------------------------------------------------------ thread */

/** The Threadline: an outlined marigold cord. `draw` lets motion.css draw it once in view. */
export function Thread({ d, draw = false, thin = false, className = "", dashed = false }: { d: string; draw?: boolean; thin?: boolean; className?: string; dashed?: boolean }) {
  const w = thin ? 3 : 5;
  return (
    <g className={`v5-thread${draw ? " is-draw" : ""} ${className}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={C.ink} strokeWidth={w + 5} pathLength={1} />
      <path d={d} stroke={C.gold} strokeWidth={w} pathLength={1} strokeDasharray={dashed ? "0.012 0.02" : undefined} />
    </g>
  );
}

/** A knot on the thread — where an encounter, a decision or a signal was tied in. */
export function Knot({ x, y, s = 1, tone = C.gold }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <circle r={9} fill={tone} {...O} />
      <path d="M-4 -2 Q0 -6 4 -2 M-4 3 Q0 7 4 3" fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    </At>
  );
}

/** A spool: the root thesis, wound. */
export function Spool({ x, y, s = 1, label, fill = C.gold }: { x: number; y: number; s?: number; label?: string; fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <rect x={-34} y={-46} width={68} height={12} rx={5} fill={C.wood} {...O} />
      <rect x={-26} y={-34} width={52} height={50} rx={8} fill={fill} {...O} />
      <path d="M-26 -22 H26 M-26 -10 H26 M-26 2 H26" stroke={C.ink} strokeWidth={2} opacity={0.55} />
      <rect x={-34} y={16} width={68} height={12} rx={5} fill={C.wood} {...O} />
      {label ? (
        <text x={0} y={50} textAnchor="middle" className="v5-label">
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
  shirt?: string;
  legs?: string;
  skin?: string;
  hair?: string;
  hairStyle?: "short" | "bob" | "bun" | "curly" | "bald" | "side";
  glasses?: boolean;
  /** Hand positions relative to the figure's origin (feet, centre). */
  armL?: [number, number];
  armR?: [number, number];
  sit?: boolean;
  look?: -1 | 0 | 1;
  mood?: "smile" | "flat" | "oh" | "grin";
  apron?: string;
  className?: string;
};

function Limb({ from, to, bend = 10, tone }: { from: [number, number]; to: [number, number]; bend?: number; tone: string }) {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ex = mx + (-dy / len) * bend;
  const ey = my + (dx / len) * bend;
  const d = `M${from[0]} ${from[1]} Q${ex} ${ey} ${to[0]} ${to[1]}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={C.ink} strokeWidth={15} />
      <path d={d} stroke={tone} strokeWidth={9} />
    </g>
  );
}

/** One figure, ~160 units tall at s=1, origin at the feet. */
export function Person({ x, y, s = 1, flip, shirt = C.coral, legs = C.navy, skin = SKIN[0], hair = C.ink, hairStyle = "short", glasses, armL = [-30, -62], armR = [30, -62], sit, look = 0, mood = "smile", apron, className }: PersonProps) {
  const e = look * 2.2;
  return (
    <At x={x} y={y} s={s} flip={flip} className={className}>
      {/* legs */}
      {sit ? (
        <g>
          <Limb from={[-9, -58]} to={[26, -50]} bend={0} tone={legs} />
          <Limb from={[26, -50]} to={[30, -6]} bend={0} tone={legs} />
          <Limb from={[9, -58]} to={[40, -52]} bend={0} tone={legs} />
          <Limb from={[40, -52]} to={[44, -6]} bend={0} tone={legs} />
          <ellipse cx={36} cy={-3} rx={11} ry={6} fill={C.ink} />
          <ellipse cx={50} cy={-3} rx={11} ry={6} fill={C.ink} />
        </g>
      ) : (
        <g>
          <Limb from={[-10, -58]} to={[-11, -8]} bend={0} tone={legs} />
          <Limb from={[10, -58]} to={[11, -8]} bend={0} tone={legs} />
          <ellipse cx={-14} cy={-3} rx={12} ry={6} fill={C.ink} />
          <ellipse cx={14} cy={-3} rx={12} ry={6} fill={C.ink} />
        </g>
      )}
      {/* far arm behind the torso */}
      <Limb from={[-19, -106]} to={armL} bend={-9} tone={shirt} />
      {/* torso */}
      <path d="M-21 -110 Q-22 -118 -13 -118 L13 -118 Q22 -118 21 -110 L25 -58 Q25 -52 19 -52 L-19 -52 Q-25 -52 -25 -58 Z" fill={shirt} {...O} />
      {apron ? <path d="M-13 -100 L13 -100 L17 -54 L-17 -54 Z" fill={apron} {...O} /> : null}
      {/* neck + head */}
      <rect x={-6} y={-126} width={12} height={12} fill={skin} {...O} />
      <circle cx={0} cy={-140} r={18} fill={skin} {...O} />
      {/* hair */}
      {hairStyle === "short" && <path d="M-18 -142 A18 18 0 0 1 18 -142 Q9 -150 -2 -147 Q-11 -145 -18 -142 Z" fill={hair} {...O} />}
      {hairStyle === "side" && <path d="M-18 -140 A18 18 0 0 1 18 -144 Q4 -146 -4 -156 Q-6 -146 -18 -140 Z" fill={hair} {...O} />}
      {hairStyle === "bob" && <path d="M-19 -124 Q-23 -150 -8 -157 Q10 -162 19 -146 Q22 -134 19 -124 L13 -126 Q15 -144 0 -147 Q-13 -146 -13 -126 Z" fill={hair} {...O} />}
      {hairStyle === "bun" && (
        <g>
          <circle cx={0} cy={-163} r={8} fill={hair} {...O} />
          <path d="M-18 -142 A18 18 0 0 1 18 -142 Q8 -152 0 -151 Q-8 -152 -18 -142 Z" fill={hair} {...O} />
        </g>
      )}
      {hairStyle === "curly" && (
        <g fill={hair} {...O}>
          <circle cx={-13} cy={-151} r={8} />
          <circle cx={0} cy={-157} r={9} />
          <circle cx={13} cy={-151} r={8} />
          <circle cx={-18} cy={-141} r={6} />
          <circle cx={18} cy={-141} r={6} />
        </g>
      )}
      {/* face */}
      <circle cx={-6 + e} cy={-140} r={2.4} fill={C.ink} />
      <circle cx={6 + e} cy={-140} r={2.4} fill={C.ink} />
      {glasses ? (
        <g fill="none" stroke={C.ink} strokeWidth={2}>
          <circle cx={-6 + e} cy={-140} r={6} />
          <circle cx={6 + e} cy={-140} r={6} />
          <path d={`M${0 + e - 0.5} -140 h1`} />
        </g>
      ) : null}
      {mood === "smile" && <path d={`M${-5 + e} -131 Q${e} -126 ${5 + e} -131`} fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />}
      {mood === "grin" && <path d={`M${-6 + e} -132 Q${e} -123 ${6 + e} -132 Z`} fill={C.white} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />}
      {mood === "flat" && <path d={`M${-4 + e} -130 H${4 + e}`} stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />}
      {mood === "oh" && <circle cx={e} cy={-130} r={3} fill={C.ink} />}
      {/* near arm + hands */}
      <Limb from={[19, -106]} to={armR} bend={9} tone={shirt} />
      <circle cx={armL[0]} cy={armL[1]} r={7} fill={skin} {...O} />
      <circle cx={armR[0]} cy={armR[1]} r={7} fill={skin} {...O} />
    </At>
  );
}

/* --------------------------------------------------------------- artefacts */

export type ArtefactKind = "post" | "video" | "doc" | "proof" | "deep" | "diagnostic" | "nurture" | "update";

/** A native artefact, ~64 × 84 at s=1, origin at its centre. Each kind has its own silhouette. */
export function Artefact({ kind, x, y, s = 1, r = 0, tone, className }: { kind: ArtefactKind; x: number; y: number; s?: number; r?: number; tone?: string; className?: string }) {
  return (
    <At x={x} y={y} s={s} r={r} className={className}>
      {kind === "post" && (
        <g>
          <rect x={-32} y={-42} width={64} height={84} rx={7} fill={tone ?? C.white} {...O} />
          <circle cx={-18} cy={-26} r={7} fill={C.coral} {...O} strokeWidth={2.4} />
          <path d="M-6 -29 H20 M-6 -22 H12" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <path d="M-22 -6 H22 M-22 6 H22 M-22 18 H10" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
        </g>
      )}
      {kind === "update" && (
        <g opacity={0.9}>
          <rect x={-32} y={-42} width={64} height={84} rx={7} fill={tone ?? "#E4E6EA"} {...O} />
          <path d="M-22 -24 H22 M-22 -10 H22 M-22 4 H22 M-22 18 H4" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.35} />
        </g>
      )}
      {kind === "video" && (
        <g>
          <rect x={-27} y={-46} width={54} height={92} rx={11} fill={C.navy} {...O} />
          <rect x={-21} y={-36} width={42} height={66} rx={5} fill={tone ?? C.lilac} {...O} strokeWidth={2.4} />
          <path d="M-7 -14 L12 -3 L-7 8 Z" fill={C.white} {...O} strokeWidth={2.4} />
          <circle cx={0} cy={38} r={3} fill={C.paper} />
        </g>
      )}
      {kind === "doc" && (
        <g>
          <rect x={-22} y={-34} width={64} height={80} rx={6} fill={C.butter} {...O} />
          <rect x={-29} y={-40} width={64} height={80} rx={6} fill={C.paper} {...O} />
          <rect x={-36} y={-46} width={64} height={80} rx={6} fill={tone ?? C.white} {...O} />
          <rect x={-27} y={-36} width={46} height={26} rx={4} fill={C.mint} {...O} strokeWidth={2.4} />
          <path d="M-27 0 H18 M-27 12 H8" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {kind === "proof" && (
        <g>
          <rect x={-32} y={-42} width={64} height={84} rx={7} fill={tone ?? C.white} {...O} />
          <path d="M-20 -26 H20 M-20 -14 H20 M-20 -2 H6" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          <circle cx={12} cy={22} r={13} fill={C.mint} {...O} />
          <path d="M6 22 L11 27 L19 17" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {kind === "deep" && (
        <g>
          <path d="M-36 -38 Q-18 -46 0 -36 Q18 -46 36 -38 V38 Q18 30 0 40 Q-18 30 -36 38 Z" fill={tone ?? C.lilac} {...O} />
          <path d="M0 -36 V40" stroke={C.ink} strokeWidth={3} />
          <path d="M-26 -22 Q-16 -26 -8 -21 M-26 -8 Q-16 -12 -8 -7 M8 -21 Q16 -26 26 -22 M8 -7 Q16 -12 26 -8 M8 7 Q16 2 26 6" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
        </g>
      )}
      {kind === "diagnostic" && (
        <g>
          <rect x={-32} y={-40} width={64} height={84} rx={7} fill={tone ?? C.wood} {...O} />
          <rect x={-25} y={-30} width={50} height={68} rx={4} fill={C.white} {...O} strokeWidth={2.4} />
          <rect x={-12} y={-48} width={24} height={14} rx={5} fill={C.navySoft} {...O} />
          {[-16, 0, 16].map((yy) => (
            <g key={yy}>
              <rect x={-19} y={yy - 5} width={10} height={10} rx={2} fill={yy === 16 ? C.white : C.mint} stroke={C.ink} strokeWidth={2} />
              <path d={`M-3 ${yy} H18`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
            </g>
          ))}
        </g>
      )}
      {kind === "nurture" && (
        <g>
          <rect x={-38} y={-27} width={76} height={54} rx={6} fill={tone ?? C.coral} {...O} />
          <path d="M-38 -22 L0 8 L38 -22" fill="none" {...O} />
          <circle cx={0} cy={10} r={8} fill={C.gold} {...O} strokeWidth={2.4} />
        </g>
      )}
    </At>
  );
}

/** A peg on the line and the artefact hanging from it. Origin is the point on the thread. */
export function Pegged({ kind, x, y, r = 0, s = 1, tone, sway = false }: { kind: ArtefactKind; x: number; y: number; r?: number; s?: number; tone?: string; sway?: boolean }) {
  return (
    <At x={x} y={y} r={r} s={s}>
      <g className={sway ? "v5-sway" : undefined}>
        <Artefact kind={kind} x={0} y={kind === "nurture" ? 40 : 56} tone={tone} />
        <rect x={-6} y={-10} width={12} height={28} rx={4} fill={C.wood} {...O} strokeWidth={2.4} />
        <path d="M-6 2 H6" stroke={C.ink} strokeWidth={2} />
      </g>
    </At>
  );
}

/* ------------------------------------------------------------------- props */

export function Crate({ x, y, w = 110, h = 64, label, fill = C.wood, s = 1, r = 0 }: { x: number; y: number; w?: number; h?: number; label?: string; fill?: string; s?: number; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={fill} {...O} />
      <path d={`M${-w / 2} ${-h + 14} H${w / 2}`} stroke={C.ink} strokeWidth={2.4} opacity={0.5} />
      {label ? (
        <text x={0} y={-h / 2 + 12} textAnchor="middle" className="v5-label">
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
        <rect key={i} x={-w / 2 + ((i * 7) % 9) - 4} y={-10 - i * 9} width={w} height={10} rx={3} fill={i % 3 === 1 ? C.butter : fill} {...O} strokeWidth={2.4} />
      ))}
    </At>
  );
}

export function Folder({ x, y, fill = C.mint, label, s = 1, r = 0 }: { x: number; y: number; fill?: string; label?: string; s?: number; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <path d="M-52 -58 H-14 L-4 -48 H52 V0 H-52 Z" fill={fill} {...O} />
      <path d="M-52 -40 H52" stroke={C.ink} strokeWidth={2.4} opacity={0.5} />
      {label ? (
        <text x={0} y={-14} textAnchor="middle" className="v5-label is-xs">
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
      <rect x={x} y={y - h} width={w} height={h} rx={3} fill={fill} {...O} strokeWidth={2.4} />
      <rect x={x + 4} y={y - h + 10} width={w - 8} height={14} rx={2} fill={C.white} stroke={C.ink} strokeWidth={1.8} />
      <circle cx={x + w / 2} cy={y - 12} r={3} fill="none" stroke={C.ink} strokeWidth={1.8} />
    </g>
  );
}

export function Gear({ x, y, r = 30, fill = C.lilac, teeth = 10, className = "v5-spin" }: { x: number; y: number; r?: number; fill?: string; teeth?: number; className?: string }) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (Math.PI * i) / teeth;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const a2 = a + Math.PI / teeth / 2.4;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`, `${(Math.cos(a2) * rr).toFixed(1)},${(Math.sin(a2) * rr).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <polygon points={pts.join(" ")} fill={fill} {...O} />
        <circle r={r * 0.32} fill={C.paper} {...O} />
      </g>
    </g>
  );
}

export function Lamp({ x, y, s = 1, flip }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <At x={x} y={y} s={s} flip={flip}>
      <path d="M0 0 V-46 L30 -78" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 -92 L52 -76 L40 -58 L14 -72 Z" fill={C.butter} {...O} />
      <ellipse cx={0} cy={0} rx={20} ry={6} fill={C.navySoft} {...O} />
    </At>
  );
}

export function Desk({ x, y, w = 200, fill = C.wood }: { x: number; y: number; w?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-64} width={w} height={14} rx={5} fill={fill} {...O} />
      <path d={`M${-w / 2 + 16} -50 V0 M${w / 2 - 16} -50 V0`} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

export function Armchair({ x, y, s = 1, fill = C.lilac }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <path d="M-46 -112 Q-46 -132 -24 -132 H20 Q42 -132 42 -112 V-46 H-46 Z" fill={fill} {...O} />
      <rect x={-58} y={-70} width={24} height={52} rx={10} fill={fill} {...O} />
      <rect x={34} y={-70} width={24} height={52} rx={10} fill={fill} {...O} />
      <rect x={-40} y={-56} width={80} height={36} rx={8} fill={fill} {...O} />
      <path d="M-40 -18 V-4 M40 -18 V-4" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    </At>
  );
}

/** A small mark of recognition over a buyer's head. */
export function Spark({ x, y, s = 1, tone = C.gold }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <g className="v5-twinkle">
        <path d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={tone} {...O} strokeWidth={2.4} />
      </g>
    </At>
  );
}

/** A commercial signal: a small marigold token with a tail, travelling back along the line. */
export function Signal({ x, y, label, s = 1 }: { x: number; y: number; label?: string; s?: number }) {
  return (
    <At x={x} y={y} s={s}>
      <rect x={label ? -(label.length * 5 + 22) : -14} y={-15} width={label ? label.length * 10 + 44 : 28} height={30} rx={15} fill={C.gold} {...O} />
      {label ? (
        <text x={0} y={5} textAnchor="middle" className="v5-label is-ink">
          {label}
        </text>
      ) : null}
    </At>
  );
}

/** A hand-set label plate for a station or a room. */
export function Plate({ x, y, children, tone = C.paper, w }: { x: number; y: number; children: string; tone?: string; w?: number }) {
  const width = w ?? children.length * 10.5 + 28;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-width / 2} y={-16} width={width} height={32} rx={8} fill={tone} {...O} strokeWidth={2.4} />
      <text x={0} y={5.5} textAnchor="middle" className="v5-label is-ink">
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
        <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.13  0 0 0 0 0.22  0 0 0 0.09 0" />
      </filter>
    </defs>
  );
}

export const outline = O;
