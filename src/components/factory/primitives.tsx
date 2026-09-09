import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * THE THREADLINE AUTHORITY FACTORY — illustration primitives.
 *
 * Original SVG parts drawn to one spec (design-system/threadline-design-dna.json):
 * 2px ink outlines, 1.5px detail, 3px ember thread, flat palette fills, front-on
 * with a slight isometric cheat on belts, no vanishing point. Characters are
 * 5.5 heads, round heads, dot eyes, one-line mouths. Colours come from the
 * `.tl-public` CSS variables so the same part sits on canvas or paper.
 *
 * Every part is a server-safe component; motion is applied by class from
 * public.css and switched off by prefers-reduced-motion.
 */

const INK = "var(--ink)";
const PAPER = "var(--paper)";
const STEEL = "var(--steel-soft)";
const STEEL_DEEP = "var(--steel)";
const ACCENT = "var(--accent)";
const STAMP = "var(--stamp)";
const SIGNAL = "var(--signal)";
const SIGNAL_SOFT = "var(--signal-soft)";
const CANVAS_DEEP = "var(--canvas-deep)";

type SvgProps = ComponentProps<"svg"> & { title?: string };

function Svg({ title, children, viewBox, className, ...rest }: SvgProps & { children: ReactNode; viewBox: string }) {
  return (
    <svg viewBox={viewBox} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* --------------------------------- Brand ---------------------------------- */

/** Wordmark: the name with the thread running through the L. */
export function ThreadWordmark({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 220 32" className={className} title="Threadline">
      <text x="0" y="24" fontFamily="var(--font-display), Georgia, serif" fontSize="26" fontWeight="600" letterSpacing="-0.02em" fill={INK}>
        Threadline
      </text>
      <path d="M2 29 C 40 22, 80 34, 120 27 S 190 30, 218 24" stroke={ACCENT} strokeWidth="2.5" />
    </Svg>
  );
}

/** A long horizontal thread, used as a divider or under the footer wordmark. */
export function ThreadLine({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 1200 40" preserveAspectRatio="none" className={className}>
      <path d="M0 22 C 120 4, 200 40, 320 20 S 520 2, 640 22 S 860 40, 980 18 S 1120 6, 1200 24" stroke={ACCENT} strokeWidth="3" />
    </Svg>
  );
}

/* --------------------------------- Parts ---------------------------------- */

/** A crate of raw expertise. Tilted a couple of degrees so it reads as handled, not manufactured. */
export function Crate({ label, tilt = 0, className, tone = "paper" }: { label: string; tilt?: number; className?: string; tone?: "paper" | "stamp" | "accent" }) {
  const fill = tone === "stamp" ? STAMP : tone === "accent" ? "var(--accent-soft)" : PAPER;
  return (
    <div className={cn("inline-flex w-[120px] max-w-full flex-col items-center", className)} style={{ transform: `rotate(${tilt}deg)` }}>
      <Svg viewBox="0 0 120 84" className="h-auto w-full" title={`Crate labelled ${label}`}>
        <rect x="6" y="18" width="108" height="60" rx="6" fill={fill} stroke={INK} strokeWidth="2" />
        <path d="M6 40 H114 M6 58 H114" stroke={INK} strokeWidth="1.5" opacity="0.5" />
        <path d="M22 18 V78 M98 18 V78" stroke={INK} strokeWidth="1.5" opacity="0.5" />
        <rect x="22" y="4" width="76" height="18" rx="4" fill={PAPER} stroke={INK} strokeWidth="2" />
        <text x="60" y="17" textAnchor="middle" fontFamily="var(--font-label), monospace" fontSize="8" fontWeight="600" letterSpacing="0.5" fill={INK}>
          {label.toUpperCase()}
        </text>
      </Svg>
    </div>
  );
}

/** Conveyor belt — the motion is the CSS `tl-belt` stripe loop. */
export function Conveyor({ className, slow, label }: { className?: string; slow?: boolean; label?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className={cn("tl-belt", slow && "tl-belt-slow")} />
      <div className="mt-1 flex justify-between px-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="block size-3 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--steel-soft)]" />
        ))}
      </div>
      {label ? <span className="tl-label absolute -top-5 left-2 text-[color:var(--ink-faint)]">{label}</span> : null}
    </div>
  );
}

/** Generic station chassis: steel body, paper face, one stamp-yellow indicator light. */
function Chassis({ children, title, lit = true, width = 150, className }: { children: ReactNode; title: string; lit?: boolean; width?: number; className?: string }) {
  return (
    <Svg viewBox="0 0 150 130" className={cn("h-auto", className)} style={{ width }} title={title}>
      <rect x="10" y="30" width="130" height="86" rx="10" fill={STEEL} stroke={INK} strokeWidth="2" />
      <rect x="20" y="42" width="110" height="60" rx="6" fill={PAPER} stroke={INK} strokeWidth="1.5" />
      <rect x="28" y="116" width="94" height="8" rx="2" fill={STEEL_DEEP} stroke={INK} strokeWidth="1.5" />
      <circle cx="126" cy="36" r="4" fill={lit ? STAMP : CANVAS_DEEP} stroke={INK} strokeWidth="1.5" className={lit ? "tl-light" : undefined} />
      {children}
    </Svg>
  );
}

export function ScannerStation({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Research scanner" lit={lit} className={className}>
      <path d="M75 8 V30" stroke={INK} strokeWidth="2" />
      <circle cx="75" cy="8" r="5" fill={PAPER} stroke={INK} strokeWidth="2" />
      <ellipse cx="75" cy="72" rx="22" ry="12" fill={SIGNAL_SOFT} stroke={INK} strokeWidth="1.5" />
      <circle cx="75" cy="72" r="6" fill={SIGNAL} stroke={INK} strokeWidth="1.5" />
      <path d="M40 60 L110 60 M40 84 L110 84" stroke={INK} strokeWidth="1" opacity="0.35" />
    </Chassis>
  );
}

export function AssemblyStation({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Idea and script assembly" lit={lit} className={className}>
      <path d="M40 24 h20 v-10 h30 v10 h20" stroke={INK} strokeWidth="2" fill={PAPER} />
      <path d="M36 60 h78 M36 70 h60 M36 80 h70 M36 90 h44" stroke={INK} strokeWidth="2" opacity="0.7" />
      <path d="M100 86 l6 -6 l4 4 l-6 6z" fill={ACCENT} stroke={INK} strokeWidth="1.5" />
    </Chassis>
  );
}

export function RecordStation({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Recording station" lit={lit} className={className}>
      <rect x="52" y="52" width="46" height="34" rx="6" fill={INK} />
      <circle cx="75" cy="69" r="9" fill={PAPER} stroke={INK} strokeWidth="2" />
      <circle cx="75" cy="69" r="3.5" fill={INK} />
      <circle cx="94" cy="58" r="3" fill={ACCENT} />
      <path d="M98 66 h14 l6 -6 v22 l-6 -6 h-14z" fill={STEEL_DEEP} stroke={INK} strokeWidth="1.5" />
      <path d="M40 92 h70" stroke={INK} strokeWidth="1.5" opacity="0.4" />
    </Chassis>
  );
}

export function BuilderStation({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Editing and packaging build" lit={lit} className={className}>
      <rect x="34" y="52" width="82" height="10" rx="3" fill={STEEL_DEEP} stroke={INK} strokeWidth="1.5" />
      <rect x="34" y="66" width="52" height="10" rx="3" fill={ACCENT} stroke={INK} strokeWidth="1.5" />
      <rect x="34" y="80" width="66" height="10" rx="3" fill={STAMP} stroke={INK} strokeWidth="1.5" />
      <path d="M70 46 l4 -8 l4 8" stroke={INK} strokeWidth="1.5" />
    </Chassis>
  );
}

export function InspectorStation({ lit, className, stamp = "APPROVED", reject }: { lit?: boolean; className?: string; stamp?: string; reject?: boolean }) {
  return (
    <Chassis title={`Judge and fact-check inspector, stamping ${stamp}`} lit={lit} className={className}>
      <circle cx="58" cy="70" r="12" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M67 79 l10 10" stroke={INK} strokeWidth="2.5" />
      <rect x="84" y="56" width="36" height="28" rx="4" transform="rotate(-3 102 70)" fill={reject ? PAPER : STAMP} stroke={reject ? "var(--reject)" : INK} strokeWidth="2" />
      <text x="102" y="74" textAnchor="middle" transform="rotate(-3 102 70)" fontFamily="var(--font-label), monospace" fontSize="7" fontWeight="700" letterSpacing="1" fill={reject ? "var(--reject)" : INK}>
        {stamp}
      </text>
    </Chassis>
  );
}

export function PackagingStation({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Packaging station" lit={lit} className={className}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${36 + i * 28} 58)`}>
          <rect width="22" height="30" rx="3" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <rect x="4" y="4" width="14" height="6" rx="1" fill={i === 1 ? ACCENT : STEEL} />
          <path d="M4 16 h14 M4 21 h10" stroke={INK} strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      <path d="M22 50 h106" stroke={INK} strokeWidth="1" opacity="0.3" />
    </Chassis>
  );
}

export function DistributionSorter({ lit, className }: { lit?: boolean; className?: string }) {
  return (
    <Chassis title="Distribution sorter" lit={lit} className={className}>
      <path d="M30 72 h30" stroke={INK} strokeWidth="2" />
      <path d="M60 72 C 80 72, 80 52, 100 52 M60 72 h40 M60 72 C 80 72, 80 92, 100 92" stroke={INK} strokeWidth="2" />
      {[52, 72, 92].map((y, i) => (
        <g key={y}>
          <rect x="100" y={y - 6} width="18" height="12" rx="2" fill={i === 0 ? ACCENT : i === 1 ? STAMP : SIGNAL_SOFT} stroke={INK} strokeWidth="1.5" />
          <path d={`M118 ${y} h8`} stroke={INK} strokeWidth="1.5" />
        </g>
      ))}
    </Chassis>
  );
}

/* ------------------------------- Characters ------------------------------- */

function Figure({ title, className, body, head, extra, colour = STEEL }: { title: string; className?: string; body?: ReactNode; head?: ReactNode; extra?: ReactNode; colour?: string }) {
  return (
    <Svg viewBox="0 0 80 140" className={cn("h-auto w-[80px]", className)} title={title}>
      {extra}
      <circle cx="40" cy="22" r="16" fill={PAPER} stroke={INK} strokeWidth="2" />
      <circle cx="34" cy="21" r="1.8" fill={INK} />
      <circle cx="46" cy="21" r="1.8" fill={INK} />
      <path d="M35 29 q5 3 10 0" stroke={INK} strokeWidth="1.5" />
      {head}
      <path d="M22 60 q18 -22 36 0 v46 h-36z" fill={colour} stroke={INK} strokeWidth="2" />
      {body}
      <path d="M31 106 v26 M49 106 v26" stroke={INK} strokeWidth="2" />
      <path d="M26 132 h10 M44 132 h10" stroke={INK} strokeWidth="2.5" />
    </Svg>
  );
}

/** The expert: open collar, holding a crate. */
export function Founder({ className, holding = true }: { className?: string; holding?: boolean }) {
  return (
    <Figure
      title="The founder, holding a crate of expertise"
      className={className}
      colour="var(--accent-soft)"
      head={<path d="M27 8 q13 -10 26 0" stroke={INK} strokeWidth="2" />}
      body={
        <>
          <path d="M40 44 l-6 10 l6 6 l6 -6z" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          {holding ? (
            <>
              <path d="M22 72 h-8 M58 72 h8" stroke={INK} strokeWidth="2" />
              <rect x="4" y="66" width="72" height="26" rx="4" fill={PAPER} stroke={INK} strokeWidth="2" />
              <text x="40" y="83" textAnchor="middle" fontFamily="var(--font-label), monospace" fontSize="7.5" fontWeight="700" letterSpacing="0.5" fill={INK}>EXPERTISE</text>
            </>
          ) : (
            <path d="M22 66 l-8 18 M58 66 l8 18" stroke={INK} strokeWidth="2" />
          )}
        </>
      }
    />
  );
}

/** The operator: sleeves rolled, clipboard. */
export function Operator({ className }: { className?: string }) {
  return (
    <Figure
      title="The Threadline operator, with a clipboard"
      className={className}
      colour={STEEL}
      head={<path d="M24 12 h32" stroke={INK} strokeWidth="2.5" />}
      body={
        <>
          <path d="M22 66 l-8 14 M58 66 l8 12" stroke={INK} strokeWidth="2" />
          <rect x="52" y="76" width="22" height="28" rx="2" transform="rotate(-8 63 90)" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <path d="M57 84 h12 M57 90 h9 M57 96 h11" stroke={INK} strokeWidth="1" transform="rotate(-8 63 90)" />
        </>
      }
    />
  );
}

/** The buyer: a small figure who has stopped walking and turned to look. */
export function Buyer({ className, looking = true }: { className?: string; looking?: boolean }) {
  return (
    <Figure
      title={looking ? "A buyer, stopped and looking" : "A buyer, walking past"}
      className={className}
      colour={SIGNAL_SOFT}
      head={looking ? <path d="M52 20 l10 -4" stroke={SIGNAL} strokeWidth="2" /> : null}
      body={<path d="M22 66 l-6 16 M58 66 l6 16" stroke={INK} strokeWidth="2" />}
    />
  );
}

/* ------------------------------ Signals and pipes ------------------------------ */

/** A signal: the dot that carries the market's response. */
export function SignalPulse({ className, still }: { className?: string; still?: boolean }) {
  return <span aria-hidden className={cn("inline-block size-4 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--signal)]", !still && "tl-light", className)} />;
}

/**
 * The return pipe: a path from the market back to the front of the line,
 * with a pulse travelling along it (CSS offset-path; still dot when reduced).
 */
export function FeedbackPipe({ className, width = 640 }: { className?: string; width?: number }) {
  const d = `M ${width - 20} 20 C ${width - 20} 90, ${width * 0.55} 90, ${width * 0.5} 60 S 60 24, 20 70`;
  return (
    <div className={cn("relative", className)} style={{ width: "100%", aspectRatio: `${width} / 110` }} aria-hidden>
      <svg viewBox={`0 0 ${width} 110`} className="absolute inset-0 h-full w-full" fill="none">
        <path d={d} stroke={INK} strokeWidth="10" strokeLinecap="round" />
        <path d={d} stroke={SIGNAL_SOFT} strokeWidth="6" strokeLinecap="round" />
        <path d={d} stroke={SIGNAL} strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />
        <path d={`M20 70 l-10 -8 M20 70 l-10 8`} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="tl-pulse absolute left-0 top-0 block size-4 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--signal)]" style={{ offsetPath: `path("${d}")`, offsetDistance: "0%" }} />
    </div>
  );
}

/** A thread that branches from one source into many packages (draws on reveal). */
export function BranchingThread({ branches = 6, className }: { branches?: number; className?: string }) {
  const H = 40 + branches * 44;
  return (
    <Svg viewBox={`0 0 420 ${H}`} className={cn("h-auto w-full", className)}>
      <path d="M20 50 C 80 50, 110 50, 150 50" stroke={ACCENT} strokeWidth="3" className="tl-draw" style={{ ["--len" as string]: "160" }} />
      {Array.from({ length: branches }).map((_, i) => {
        const y = 30 + i * 44;
        return <path key={i} d={`M150 50 C 220 50, 240 ${y}, 320 ${y}`} stroke={ACCENT} strokeWidth="3" className="tl-draw" style={{ ["--len" as string]: "260", transitionDelay: `${180 + i * 90}ms` }} />;
      })}
      <circle cx="20" cy="50" r="8" fill={ACCENT} stroke={INK} strokeWidth="2" />
      <circle cx="150" cy="50" r="6" fill={PAPER} stroke={INK} strokeWidth="2" />
    </Svg>
  );
}

/** Five encounters: the same buyer meeting the thread again and again. */
export function MemoryWeave({ stages, className }: { stages: readonly string[]; className?: string }) {
  const W = 720;
  const step = (W - 80) / (stages.length - 1);
  return (
    <Svg viewBox={`0 0 ${W} 160`} className={cn("h-auto w-full", className)}>
      <path d={`M20 90 ${stages.slice(1).map((_, i) => `S ${40 + i * step + step / 2} ${i % 2 ? 40 : 140}, ${40 + (i + 1) * step} 90`).join(" ")}`} stroke={ACCENT} strokeWidth="3" className="tl-draw" style={{ ["--len" as string]: "1200" }} />
      {stages.map((s, i) => {
        const x = 40 + i * step;
        const looking = i >= 1;
        return (
          <g key={s} transform={`translate(${x - 14} 58)`}>
            <circle cx="14" cy="12" r="10" fill={PAPER} stroke={INK} strokeWidth="2" />
            <circle cx="11" cy="11" r="1.4" fill={INK} />
            <circle cx="17" cy="11" r="1.4" fill={INK} />
            <path d={looking ? "M11 16 q3 2 6 0" : "M11 17 h6"} stroke={INK} strokeWidth="1.3" />
            <path d="M4 42 q10 -14 20 0 v22 h-20z" fill={i === stages.length - 1 ? SIGNAL_SOFT : STEEL} stroke={INK} strokeWidth="2" />
            <text x="14" y="86" textAnchor="middle" fontFamily="var(--font-label), monospace" fontSize="9" fontWeight="600" letterSpacing="1" fill={INK}>
              {s.toUpperCase()}
            </text>
          </g>
        );
      })}
    </Svg>
  );
}

/** A big display stamp (used for SLOP / APPROVED moments). */
export function StampMark({ label, reject, className, animate }: { label: string; reject?: boolean; className?: string; animate?: boolean }) {
  return (
    <span className={cn("tl-stamp text-[clamp(0.9rem,1.6vw,1.25rem)]", reject && "tl-stamp-reject", animate && "tl-stamp-in", className)}>
      {label}
    </span>
  );
}
