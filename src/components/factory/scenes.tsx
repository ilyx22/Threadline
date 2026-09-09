import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/marketing/reveal";
import { Chip, Stamp, SyntheticLabel } from "@/components/public/primitives";
import { BranchingThread, Buyer, Conveyor, Crate, FeedbackPipe, Founder, InspectorStation, MemoryWeave, Operator, PackagingStation, ScannerStation, SignalPulse, StampMark } from "./primitives";

/**
 * Composed scenes — each one explains one section of the story. Scenes are
 * server components; the only client piece is MachineLine (scroll-linked).
 */

/** Hero: the founder puts crates on the line; the first station takes them. */
export function HeroScene({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)} aria-label="The founder places crates of expertise onto the Threadline line" role="img">
      <div className="flex items-end gap-3 sm:gap-5">
        <Founder className="w-[64px] shrink-0 sm:w-[80px]" />
        <div className="flex min-w-0 flex-1 items-end gap-2 overflow-hidden">
          <Crate label="Expertise" tilt={-2} className="w-[88px] sm:w-[110px]" />
          <Crate label="Stories" tilt={2} className="hidden w-[88px] sm:inline-flex sm:w-[110px]" />
          <Crate label="Proof" tilt={-1} className="hidden w-[110px] md:inline-flex" />
        </div>
        <ScannerStation className="w-[110px] shrink-0 sm:w-[140px]" />
      </div>
      <Conveyor className="mt-3" />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Chip>in: expertise</Chip>
        <span className="text-[color:var(--ink-faint)]" aria-hidden>→</span>
        <Chip>out: content people want to watch</Chip>
        <span className="text-[color:var(--ink-faint)]" aria-hidden>→</span>
        <Chip>back: what the market did</Chip>
      </div>
    </div>
  );
}

/** Problem: the founder surrounded by valuable crates nobody sees. */
export function ProblemScene({ crates }: { crates: readonly string[] }) {
  return (
    <div className="relative rounded-[20px] border-[1.5px] border-dashed border-[color:var(--ink-faint)] p-6 sm:p-8" role="img" aria-label="A founder surrounded by crates of expertise that never reach the market">
      <div className="flex flex-wrap items-end justify-center gap-4">
        {crates.slice(0, 2).map((c, i) => (
          <Crate key={c} label={c} tilt={i ? 3 : -3} className="w-[96px]" />
        ))}
        <Founder holding={false} className="w-[72px]" />
        {crates.slice(2).map((c, i) => (
          <Crate key={c} label={c} tilt={i % 2 ? 2 : -2} className={cn("w-[96px]", i === 2 && "hidden sm:inline-flex")} />
        ))}
      </div>
      <p className="tl-label mt-6 text-center text-[color:var(--ink-faint)]">valuable · unseen · every week</p>
    </div>
  );
}

/** The return path: publish, then the pipe brings the market's answer back. */
export function ReturnLoopScene({ steps }: { steps: readonly { label: string; detail: string }[] }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-3">
          <PackagingStation className="w-[120px] sm:w-[140px]" />
          <Conveyor className="w-[80px] sm:w-[140px]" />
        </div>
        <div className="flex flex-col items-center">
          <Stamp animate>Published</Stamp>
          <p className="tl-label mt-3 text-[color:var(--ink-faint)]">most stop here</p>
        </div>
        <Buyer className="hidden w-[64px] sm:block" />
      </div>
      <FeedbackPipe className="mt-4" />
      <ol className="mt-6 grid gap-3 sm:grid-cols-5">
        {steps.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} as="li">
            <div className="tl-card-quiet h-full p-4">
              <div className="flex items-center gap-2">
                <SignalPulse still />
                <p className="tl-label text-[color:var(--signal)]">{s.label}</p>
              </div>
              <p className="mt-2 text-[13.5px] leading-snug text-[color:var(--ink-soft)]">{s.detail}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/** One thesis branches into packages. */
export function BranchingScene({ packages }: { packages: readonly string[] }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
      <div className="relative">
        <BranchingThread branches={packages.length} />
        <div className="pointer-events-none absolute inset-y-0 left-[3%] flex items-center">
          <Chip>one thesis</Chip>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {packages.map((p, i) => (
          <li key={`${p}-${i}`}>
            <Chip className="w-full justify-start">{p}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The same buyer, five encounters. */
export function MemoryScene({ stages }: { stages: readonly string[] }) {
  return <MemoryWeave stages={stages} className="mx-auto max-w-3xl" />;
}

/** Viral-wrong-room vs smaller-right-buyer. */
export function AttentionScene({ left, right, signals }: { left: { label: string; body: string }; right: { label: string; body: string }; signals: readonly string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="tl-card-quiet p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="tl-label text-[color:var(--ink-faint)]">{left.label}</p>
          <StampMark label="Slop" reject />
        </div>
        <p className="tl-display mt-4 text-[clamp(2.5rem,6vw,4rem)] text-[color:var(--ink-ghost)]" aria-hidden>
          1,204,000
        </p>
        <div className="mt-2 flex gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Buyer key={i} looking={false} className="w-[40px] opacity-40" />
          ))}
        </div>
        <p className="tl-body mt-4 text-[15px]">{left.body}</p>
      </div>
      <div className="tl-card p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="tl-label text-[color:var(--signal)]">{right.label}</p>
          <Stamp tone="signal">Qualified</Stamp>
        </div>
        <p className="tl-display mt-4 text-[clamp(2.5rem,6vw,4rem)]" aria-hidden>
          1,900
        </p>
        <div className="mt-2 flex items-end gap-2" aria-hidden>
          <Buyer looking className="w-[48px]" />
          <SignalPulse />
        </div>
        <p className="tl-body mt-4 text-[15px] text-[color:var(--ink)]">{right.body}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {signals.map((s) => (
            <li key={s}>
              <Chip>{s}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <p className="tl-label text-[color:var(--ink-ghost)] md:col-span-2">numbers illustrative — no client figures are shown on this site</p>
    </div>
  );
}

/** Expected → actual → failure → next test → verdict. */
export function LearningCard({ card }: { card: { expected: string; actual: string; failure: string; next: string; verdict: string } }) {
  const rows: [string, string, "ink" | "signal" | "accent"][] = [
    ["We expected", card.expected, "ink"],
    ["The market did", card.actual, "ink"],
    ["We think the failure was", card.failure, "accent"],
    ["Next test", card.next, "signal"],
  ];
  return (
    <div className="tl-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[color:var(--ink)] bg-[color:var(--canvas-deep)] px-5 py-3">
        <p className="tl-label text-[color:var(--ink)]">Diagnosis record</p>
        <SyntheticLabel>Illustrative</SyntheticLabel>
      </div>
      <dl className="divide-y divide-[color:var(--paper-edge)]">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
            <dt className={cn("tl-label pt-0.5", tone === "signal" ? "text-[color:var(--signal)]" : tone === "accent" ? "text-[color:var(--accent-deep)]" : "text-[color:var(--ink-faint)]")}>{k}</dt>
            <dd className="text-[15px] leading-relaxed text-[color:var(--ink)]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-3 border-t-[1.5px] border-[color:var(--ink)] px-5 py-4">
        <InspectorStation className="w-[72px]" stamp="RETEST" />
        <p className="text-[15px] font-medium text-[color:var(--ink)]">{card.verdict}</p>
      </div>
    </div>
  );
}

/** A chain of product records, labelled synthetic. */
export function ProofChain({ chain, label }: { chain: readonly { label: string; body: string }[]; label: string }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SyntheticLabel>{label}</SyntheticLabel>
        <Operator className="w-[44px]" />
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {chain.map((c, i) => (
          <Reveal key={c.label} delay={Math.min(i, 4) * 60} as="li">
            <div className="tl-card-quiet relative h-full p-4">
              <span className="tl-label absolute right-3 top-3 text-[color:var(--ink-ghost)]">{String(i + 1).padStart(2, "0")}</span>
              <p className="tl-label text-[color:var(--accent-deep)]">{c.label}</p>
              <p className="mt-2 text-[13.5px] leading-snug text-[color:var(--ink-soft)]">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
