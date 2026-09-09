import { Reveal } from "@/components/marketing/reveal";
import { Stamp } from "@/components/public/primitives";
import { Buyer } from "@/components/factory/primitives";

/** Attention → commercial movement as nine filled steps, then the illustrative reading with its interpretation. */
export function RouteBoard({ steps, quote, left, right, honesty, illustrative }: { steps: readonly string[]; quote: string; left: { label: string; body: string; number: string; reading: string }; right: { label: string; body: string; number: string; reading: string }; honesty: string; illustrative: string }) {
  const tone = (i: number) => (i === 6 ? "ember" : i === 7 ? "stamp" : i === 8 ? "signal" : undefined);
  return (
    <div>
      <Reveal>
        <ol className="tl-route" aria-label="The route from content to commercial movement">
          {steps.map((s, i) => (
            <li key={s} className="tl-route-step" data-tone={tone(i)} style={{ ["--i" as string]: i }}>
              <span className="tl-route-num">{String(i + 1).padStart(2, "0")}</span>
              {s}
              {i === steps.length - 1 ? <span aria-hidden className="ml-auto text-[color:var(--signal)]">↺</span> : null}
            </li>
          ))}
        </ol>
      </Reveal>
      <p className="tl-sub-title mt-10 max-w-3xl text-[color:var(--ink)]">{quote}</p>
      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{honesty}</p>
      <div className="tl-route-aside">
        <div className="tl-reading" data-tone="ghost">
          <div className="flex items-start justify-between gap-3">
            <p className="tl-label">{left.label}</p>
            <Stamp tone="reject">Slop</Stamp>
          </div>
          <p className="tl-numeral mt-4 text-[clamp(2.25rem,4.5vw,3.25rem)] text-[color:var(--ink-ghost)]" aria-hidden>
            {left.number}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--ink-soft)]">{left.reading}</p>
        </div>
        <div className="tl-reading" data-tone="signal">
          <div className="flex items-start justify-between gap-3">
            <p className="tl-label text-[color:var(--signal)]">{right.label}</p>
            <Stamp tone="signal">Qualified</Stamp>
          </div>
          <div className="mt-4 flex items-end gap-4">
            <p className="tl-numeral text-[clamp(2.25rem,4.5vw,3.25rem)] text-[color:var(--ink)]" aria-hidden>
              {right.number}
            </p>
            <Buyer looking className="mb-1 w-[30px]" />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--ink)]">{right.reading}</p>
        </div>
        <p className="tl-label md:col-span-2">{illustrative}</p>
      </div>
    </div>
  );
}
