import { Reveal } from "@/components/marketing/reveal";
import { ModuleTile, Obj } from "@/components/factory/objects";
import { Founder } from "@/components/factory/primitives";

/** The division of labour as an asymmetric split: four founder tiles, an expanding Threadline stack. */
export function LabourSplit({ you, threadline, relief }: { you: readonly { label: string; body: string }[]; threadline: readonly string[]; relief: string }) {
  return (
    <div className="tl-labour">
      <Reveal>
        <div className="flex items-end gap-3">
          <Founder className="w-[40px]" />
          <p className="tl-label text-[color:var(--accent-deep)]">You</p>
        </div>
        <div className="tl-you mt-4">
          {you.map((y) => (
            <Obj key={y.label} tone="ember" className="tl-you-tile">
              <span className="tl-you-verb">{y.label}</span>
              <span className="tl-you-body">{y.body}</span>
            </Obj>
          ))}
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div className="tl-stack">
          <p className="tl-label">Threadline</p>
          <div className="tl-stack-modules" aria-label="What Threadline handles">
            {threadline.map((t, i) => (
              <ModuleTile key={t} label={t} style={{ ["--i" as string]: i }} />
            ))}
          </div>
        </div>
        <p className="tl-body mt-5 text-[15.5px]">{relief}</p>
      </Reveal>
    </div>
  );
}
