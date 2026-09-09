import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HOW_IT_WORKS, STATIONS } from "@/content/public-site";
import { Card, Eyebrow, Lead, PublicButton, Section, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";
import { MachineLine } from "@/components/factory/machine";
import { InspectionMark, STAGE_GLYPH } from "@/components/factory/schematic";

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

      <Section band className="pt-8">
        <div className="tl-card p-5 sm:p-8">
          <MachineLine stations={STATIONS} />
        </div>
      </Section>

      <Section>
        <ol className="tl-ledger">
          {c.stages.map((s, i) => {
            const Glyph = STAGE_GLYPH[s.key];
            return (
              <Reveal key={s.key} as="li">
                <div id={s.key} className="grid scroll-mt-28 gap-5 py-8 md:grid-cols-[6rem_minmax(0,1fr)] md:items-start">
                  <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
                    <span className="tl-label text-[color:var(--accent-deep)]">{String(i + 1).padStart(2, "0")}</span>
                    {Glyph ? Glyph({ className: "w-10" }) : null}
                  </div>
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
        <ul className="tl-rule-strong mt-10 grid gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {c.gates.map((g, i) => (
            <Reveal key={g.label} delay={i * 60} as="li">
              <div className="flex items-center gap-3">
                <InspectionMark className="w-8" reject />
                <p className="tl-label text-[color:var(--ink)]">Gate {String(i + 1).padStart(2, "0")}</p>
              </div>
              <p className="tl-sub-title mt-4 text-[1.25rem]">{g.label}</p>
              <p className="tl-body mt-2 text-[14.5px]">{g.body}</p>
            </Reveal>
          ))}
        </ul>
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
