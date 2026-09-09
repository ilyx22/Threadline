import { Reveal } from "@/components/marketing/reveal";
import { ModuleTile } from "@/components/factory/objects";

/** WITHOUT A SYSTEM vs WITH THREADLINE: two chains, one obvious difference. */
export function ProblemContrast({ without, with: withSystem }: { without: { label: string; steps: readonly string[] }; with: { label: string; steps: readonly string[] } }) {
  return (
    <div className="tl-contrast">
      <Reveal className="tl-chain tl-chain-without">
        <p className="tl-label">{without.label}</p>
        <ol>
          {without.steps.map((s) => (
            <li key={s}>
              <ModuleTile label={s} />
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13.5px] text-[color:var(--ink-faint)]">Ends in a shrug. Nothing learned, nothing compounding.</p>
      </Reveal>
      <Reveal className="tl-chain tl-chain-with" delay={120}>
        <p className="tl-label text-[color:var(--accent-deep)]">{withSystem.label}</p>
        <ol>
          {withSystem.steps.map((s) => (
            <li key={s}>
              <ModuleTile label={s} />
            </li>
          ))}
        </ol>
        <p className="tl-chain-loop text-[13.5px] font-medium text-[color:var(--signal)]">
          <span aria-hidden>↺</span> Improvement feeds the next cycle
        </p>
      </Reveal>
    </div>
  );
}
