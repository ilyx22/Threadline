import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/marketing/reveal";
import { LedgerRow, Stamp, SyntheticLabel } from "@/components/public/primitives";
import { Buyer } from "./primitives";
import { Branch, InspectionMark, MemoryThread, ReturnThread } from "./schematic";

/**
 * Composed scenes (v2) — each one explains one section of the story with as
 * little ink as it can. Scenes are server components; the only client pieces
 * are MachineLine (scroll-linked) and the symptom selector.
 */

/** The return path: publish, then the thread brings the market's answer back. */
export function ReturnLoopScene({ steps }: { steps: readonly { label: string; detail: string }[] }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <p className="tl-label text-[color:var(--ink)]">Published</p>
        <p className="tl-label">most stop here</p>
      </div>
      <ReturnThread className="mt-3" />
      <ol className="tl-rule mt-8 grid gap-6 pt-6 sm:grid-cols-5 sm:gap-4">
        {steps.map((s, i) => (
          <Reveal key={s.label} delay={i * 60} as="li">
            <div className="flex items-center gap-2">
              <span aria-hidden className="block size-2.5 rounded-full bg-[color:var(--signal)]" />
              <p className="tl-label text-[color:var(--ink)]">{s.label}</p>
            </div>
            <p className="mt-2 text-[14px] leading-snug text-[color:var(--ink-soft)]">{s.detail}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/** One thesis branches into packages. */
export function BranchingScene({ packages }: { packages: readonly string[] }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
      <div className="relative">
        <Branch branches={packages.length} />
        <p className="tl-label pointer-events-none absolute left-0 top-[calc(50%-2.4rem)] text-[color:var(--accent-deep)]">one thesis</p>
      </div>
      <ol className="tl-ledger text-[15px] text-[color:var(--ink)]">
        {packages.map((p, i) => (
          <li key={`${p}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
            <span>{p}</span>
            <span className="tl-label">{String(i + 1).padStart(2, "0")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The same buyer, five encounters. */
export function MemoryScene({ stages }: { stages: readonly string[] }) {
  return (
    <div>
      <MemoryThread stages={stages} className="mx-auto max-w-3xl" />
      {/* below sm the SVG labels are too small to read; list them instead */}
      <ol className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 sm:hidden" aria-hidden>
        {stages.map((s, i) => (
          <li key={s} className={cn("tl-label", i === stages.length - 1 && "text-[color:var(--ink)]")}>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Viral-wrong-room vs smaller-right-buyer, on one hairline. */
export function AttentionScene({ left, right, signals }: { left: { label: string; body: string }; right: { label: string; body: string }; signals: readonly string[] }) {
  return (
    <div className="tl-rule-strong grid gap-10 pt-8 md:grid-cols-2 md:gap-12">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="tl-label">{left.label}</p>
          <Stamp tone="reject">Slop</Stamp>
        </div>
        <p className="tl-numeral mt-6 text-[clamp(3rem,7vw,5rem)] text-[color:var(--ink-ghost)]" aria-hidden>
          1,204,000
        </p>
        <p className="tl-body mt-5 text-[15.5px]">{left.body}</p>
      </div>
      <div className="md:border-l md:border-[color:var(--line)] md:pl-12">
        <div className="flex items-start justify-between gap-3">
          <p className="tl-label text-[color:var(--signal)]">{right.label}</p>
          <Stamp tone="signal">Qualified</Stamp>
        </div>
        <div className="mt-6 flex items-end gap-5">
          <p className="tl-numeral text-[clamp(3rem,7vw,5rem)] text-[color:var(--ink)]" aria-hidden>
            1,900
          </p>
          <Buyer looking className="mb-1 w-[34px]" />
        </div>
        <p className="tl-body mt-5 text-[15.5px] text-[color:var(--ink)]">{right.body}</p>
        <ul className="tl-ledger mt-5 text-[14.5px] text-[color:var(--ink-soft)]">
          {signals.map((s) => (
            <li key={s} className="flex items-center gap-3 py-2">
              <span aria-hidden className="block size-2 rounded-full bg-[color:var(--signal)]" />
              {s}
            </li>
          ))}
        </ul>
      </div>
      <p className="tl-label md:col-span-2">numbers illustrative — no client figures are shown on this site</p>
    </div>
  );
}

/** Expected → actual → failure → next test → verdict, as a ledger. */
export function LearningCard({ card }: { card: { expected: string; actual: string; failure: string; next: string; verdict: string } }) {
  const rows: [string, string, "signal" | "accent" | undefined][] = [
    ["We expected", card.expected, undefined],
    ["The market did", card.actual, undefined],
    ["We think the failure was", card.failure, "accent"],
    ["Next test", card.next, "signal"],
  ];
  return (
    <div className="tl-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--line)] px-5 py-3">
        <p className="tl-label text-[color:var(--ink)]">Diagnosis record</p>
        <SyntheticLabel>Illustrative</SyntheticLabel>
      </div>
      <dl className="tl-ledger px-5">
        {rows.map(([k, v, tone]) => (
          <LedgerRow key={k} label={k} tone={tone}>
            {v}
          </LedgerRow>
        ))}
      </dl>
      <div className="flex items-center gap-4 border-t border-[color:var(--line)] px-5 py-4">
        <InspectionMark className="w-10 shrink-0" />
        <p className="text-[15px] font-medium text-[color:var(--ink)]">{card.verdict}</p>
      </div>
    </div>
  );
}

/** A chain of product records, labelled synthetic, as a numbered ledger. */
export function ProofChain({ chain, label }: { chain: readonly { label: string; body: string }[]; label: string }) {
  return (
    <div>
      <div className="mb-6">
        <SyntheticLabel>{label}</SyntheticLabel>
      </div>
      <ol className="grid gap-x-12 md:grid-cols-2">
        {chain.map((c, i) => (
          <Reveal key={c.label} delay={Math.min(i, 4) * 40} as="li" className={cn("grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-[color:var(--line)] py-4", i === chain.length - 1 && "md:border-b", i === chain.length - 2 && "md:border-b")}>
            <span className="tl-label pt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="tl-label text-[color:var(--ink)]">{c.label}</p>
              <p className="mt-1 text-[14.5px] leading-snug text-[color:var(--ink-soft)]">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
