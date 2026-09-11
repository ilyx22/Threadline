import type { Metadata } from "next";
import { ArrowRight, X } from "lucide-react";
import { DIAGNOSTIC, HOME, HOME_V3, HOW_IT_WORKS, STATIONS } from "@/content/public-site";
import { Diagnostic } from "@/components/public/diagnostic";
import { ProofChain } from "@/components/factory/scenes";
import { Card, Eyebrow, Lead, PublicButton, Section, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";
import { MachineLine } from "@/components/factory/machine";
import { Obj } from "@/components/factory/objects";

/** Which stage the founder is needed at, and as what — the same four touchpoints as the homepage factory. */
const FOUNDER_AT: Record<string, string> = { raw: "Input", produce: "Record", response: "Sell" };

export const metadata: Metadata = {
  title: "How it works",
  description: "Raw expertise in. Market intelligence, content decisions, production, distribution, commercial response and learning — in that order, every service period.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  const c = HOW_IT_WORKS;
  return (
    <>
      <StickyApply showAfter={500} />
      <section className="tl-section pb-8">
        <div className="tl-container">
          <Eyebrow className="text-[color:var(--accent-deep)]">How it works</Eyebrow>
          <h1 className="tl-display max-w-[16ch]">{c.title}</h1>
          <Lead>{c.lead}</Lead>
        </div>
      </section>

      <Section id="diagnostic" band className="pt-8">
        <Eyebrow className="text-[color:var(--accent-deep)]">{DIAGNOSTIC.eyebrow}</Eyebrow>
        <Title>{DIAGNOSTIC.title}</Title>
        <Lead>{DIAGNOSTIC.lead}</Lead>
        <Diagnostic categories={DIAGNOSTIC.categories} chambers={HOME_V3.factory.chambers} stages={c.stages} symptoms={DIAGNOSTIC.symptoms} cta={DIAGNOSTIC.cta} />
      </Section>

      <Section>
        <Eyebrow>The line, station by station</Eyebrow>
        <Title>Nine stations. One job each.</Title>
        <div className="tl-card mt-10 p-5 sm:p-8">
          <MachineLine stations={STATIONS} />
        </div>
      </Section>

      <Section>
        <Eyebrow>Stage by stage</Eyebrow>
        <Title>What happens at each stage.</Title>
        <ol className="tl-stages mt-10">
          {c.stages.map((s, i) => {
            const founder = FOUNDER_AT[s.key];
            return (
              <Reveal key={s.key} as="li" delay={i * 40}>
                <div id={s.key} className="tl-stage-row scroll-mt-28">
                  <Obj tone={founder ? "ember" : "paper"} className="tl-stage-tile" aria-hidden>
                    <span className="tl-label">{String(i + 1).padStart(2, "0")}</span>
                    {founder ? <span className="tl-stage-you">You · {founder}</span> : <span className="tl-stage-us">Threadline</span>}
                  </Obj>
                  <div>
                    <h2 className="tl-sub-title">{s.title}</h2>
                    <p className="tl-body mt-3">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Section>

      <Section band>
        <Eyebrow>Gates</Eyebrow>
        <Title>Four things the machine refuses to do.</Title>
        <Lead>Each gate is a rule in the software, not a policy in a document. They exist so that a fast operation cannot become a careless one.</Lead>
        <ul className="tl-gates mt-10">
          {c.gates.map((g, i) => (
            <Reveal key={g.label} delay={i * 60} as="li">
              <Obj className="tl-gate">
                <span className="tl-gate-mark" aria-hidden>
                  <X className="size-4" strokeWidth={2.5} />
                </span>
                <p className="tl-label mt-4 text-[color:var(--ink-faint)]">Gate {String(i + 1).padStart(2, "0")}</p>
                <p className="tl-sub-title mt-1 text-[1.25rem]">{g.label}</p>
                <p className="tl-body mt-2 text-[14.5px]">{g.body}</p>
              </Obj>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section id="proof">
        <Eyebrow>{HOME.proof.eyebrow}</Eyebrow>
        <Title>{HOME.proof.title}</Title>
        <Lead>{HOME.proof.lead}</Lead>
        <div className="mt-12">
          <ProofChain chain={HOME.proof.chain} label={HOME.proof.label} />
        </div>
      </Section>

      <Section tight>
        <Card className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title>See it run on your business.</Title>
            <Lead>Apply for a diagnosis. We read every application and reply either way.</Lead>
          </div>
          <PublicButton href="/apply" primary size="lg">
            Apply
            <ArrowRight className="size-5" aria-hidden />
          </PublicButton>
        </Card>
      </Section>
    </>
  );
}
