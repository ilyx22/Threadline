import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { HOME, HOW_IT_WORKS, SITE, STATIONS } from "@/content/public-site";
import { Card, Eyebrow, Lead, PublicButton, Section, Stamp, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { HeroPanel } from "@/components/public/hero-panel";
import { SymptomSelector } from "@/components/public/symptom-selector";
import { PeriodCards } from "@/components/public/period-cards";
import { Reveal } from "@/components/marketing/reveal";
import { MachineLine } from "@/components/factory/machine";
import { AttentionScene, BranchingScene, LearningCard, MemoryScene, ProofChain, ReturnLoopScene } from "@/components/factory/scenes";
import { HeroLine } from "@/components/factory/schematic";
import { Founder } from "@/components/factory/primitives";

export const metadata: Metadata = {
  title: "Threadline — you already have the expertise",
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: "Threadline — you already have the expertise", description: SITE.tagline, url: "/", type: "website" },
};

/**
 * One story, in the order a founder asks the questions:
 * I have the raw expertise → Threadline runs the machine → the machine turns
 * it into content worth watching → it reaches the people who matter →
 * Threadline watches what happens → it learns → the next output is better
 * informed → familiarity, authority and opportunity compound.
 *
 * v2 (9 Sept 2026): same sections, same order, same copy. The presentation is
 * the restraint pass — paper on linen, hairlines, one accent per section, a
 * system drawing instead of a cartoon factory — plus three components built
 * from verified reference skeletons (hero panel, symptom selector, period
 * cards; see docs/design/COMPONENT_RECONSTRUCTION.md).
 */
export default function HomePage() {
  const h = HOME;
  return (
    <>
      <StickyApply />

      {/* ----------------------------------- Hero ---------------------------------- */}
      <HeroPanel
        eyebrow={h.hero.eyebrow}
        title={[h.hero.title[0], h.hero.title[1]]}
        lead={h.hero.lead}
        sub={h.hero.sub}
        note={h.hero.note}
        primary={SITE.primaryCta}
        secondary={SITE.secondaryCta}
        art={
          <>
            <div className="relative hidden lg:block">
              <Founder className="absolute left-0 top-[19%] w-[56px]" />
              <HeroLine stations={STATIONS.slice(0, 5)} />
            </div>
            <div className="px-6 pb-2 lg:hidden">
              <HeroLine stations={STATIONS.slice(0, 5)} compact />
            </div>
          </>
        }
      />

      {/* --------------------------------- Problem --------------------------------- */}
      <Section id="problem">
        <Eyebrow className="text-[color:var(--accent-deep)]">{h.problem.eyebrow}</Eyebrow>
        <Title>{h.problem.title}</Title>
        <Lead>{h.problem.lead}</Lead>
        <SymptomSelector symptoms={h.problem.points} stages={HOW_IT_WORKS.stages} />
      </Section>

      {/* ------------------------------ Four things -------------------------------- */}
      <Section id="four-things" rule>
        <Eyebrow>{h.fourThings.eyebrow}</Eyebrow>
        <Title>{h.fourThings.title}</Title>
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="tl-label text-[color:var(--accent-deep)]">You</p>
            <ol className="tl-ledger mt-4">
              {h.fourThings.you.map((y, i) => (
                <li key={y.label} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-5">
                  <span className="tl-numeral text-[2rem] text-[color:var(--accent)]" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <p className="tl-sub-title text-[1.375rem]">{y.label}</p>
                    <p className="tl-body mt-1 text-[15px]">{y.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:border-l lg:border-[color:var(--line)] lg:pl-16">
            <p className="tl-label">Threadline</p>
            <p className="tl-sub-title mt-4 text-[1.375rem] leading-[1.45] text-[color:var(--ink)]" aria-label="What Threadline handles">
              {h.fourThings.machine.join(" · ")}
            </p>
            <p className="tl-body mt-6">{h.fourThings.relief}</p>
          </div>
        </div>
      </Section>

      {/* -------------------------------- The machine ------------------------------- */}
      <Section id="machine" band>
        <Eyebrow className="text-[color:var(--accent-deep)]">{h.machine.eyebrow}</Eyebrow>
        <Title>{h.machine.title}</Title>
        <Lead>{h.machine.lead}</Lead>
        <div className="tl-card mt-12 p-5 sm:p-8">
          <MachineLine stations={h.machine.stations} />
        </div>
      </Section>

      {/* ------------------------------ Most stop here ----------------------------- */}
      <Section id="return">
        <Eyebrow>{h.stopsHere.eyebrow}</Eyebrow>
        <Title>{h.stopsHere.title}</Title>
        <Lead>{h.stopsHere.lead}</Lead>
        <div className="mt-12">
          <ReturnLoopScene steps={h.stopsHere.path} />
        </div>
      </Section>

      {/* -------------------------------- Branching -------------------------------- */}
      <Section id="expressions" rule>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>{h.branching.eyebrow}</Eyebrow>
            <Title>{h.branching.title}</Title>
            <Lead>{h.branching.lead}</Lead>
          </div>
          <Reveal>
            <BranchingScene packages={h.branching.packages} />
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------ Market memory ------------------------------ */}
      <Section id="memory" rule>
        <Eyebrow>{h.memory.eyebrow}</Eyebrow>
        <Title className="max-w-[24ch]">{h.memory.title}</Title>
        <Lead>{h.memory.lead}</Lead>
        <Reveal>
          <div className="mt-12">
            <MemoryScene stages={h.memory.stages} />
          </div>
        </Reveal>
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.memory.note}</p>
      </Section>

      {/* --------------------------- Commercial attention -------------------------- */}
      <Section id="attention" band>
        <Eyebrow>{h.attention.eyebrow}</Eyebrow>
        <Title>{h.attention.title}</Title>
        <Lead>{h.attention.lead}</Lead>
        <div className="mt-12">
          <AttentionScene left={h.attention.left} right={h.attention.right} signals={h.attention.signals} />
        </div>
      </Section>

      {/* ------------------------------ System learns ------------------------------ */}
      <Section id="learns">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <div>
            <Eyebrow className="text-[color:var(--accent-deep)]">{h.learns.eyebrow}</Eyebrow>
            <Title>{h.learns.title}</Title>
            <Lead>{h.learns.lead}</Lead>
            <p className="mt-6 max-w-lg text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.learns.disclaimer}</p>
          </div>
          <Reveal>
            <LearningCard card={h.learns.card} />
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------ First 12 weeks ----------------------------- */}
      <Section id="twelve-weeks" band>
        <Eyebrow>{h.twelveWeeks.eyebrow}</Eyebrow>
        <Title>{h.twelveWeeks.title}</Title>
        <Lead>{h.twelveWeeks.lead}</Lead>
        <PeriodCards periods={h.twelveWeeks.periods} />
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.twelveWeeks.note}</p>
      </Section>

      {/* -------------------------------- Product proof ---------------------------- */}
      <Section id="proof">
        <Eyebrow>{h.proof.eyebrow}</Eyebrow>
        <Title>{h.proof.title}</Title>
        <Lead>{h.proof.lead}</Lead>
        <div className="mt-12">
          <ProofChain chain={h.proof.chain} label={h.proof.label} />
        </div>
      </Section>

      {/* ------------------------------------ Fit ---------------------------------- */}
      <Section id="fit" rule>
        <Eyebrow>{h.fit.eyebrow}</Eyebrow>
        <Title>{h.fit.title}</Title>
        <div className="tl-rule-strong mt-12 grid gap-10 pt-8 md:grid-cols-2 md:gap-12">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="tl-label text-[color:var(--ink)]">A good fit</p>
              <Stamp tone="signal">Yes</Stamp>
            </div>
            <ul className="mt-5 space-y-3">
              {h.fit.good.map((g) => (
                <li key={g} className="flex gap-3 text-[15.5px] text-[color:var(--ink)]">
                  <Check className="mt-1 size-4 shrink-0 text-[color:var(--signal)]" aria-hidden />
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:border-l md:border-[color:var(--line)] md:pl-12">
            <div className="flex items-center justify-between gap-3">
              <p className="tl-label">Not a fit</p>
              <Stamp tone="reject">Not yet</Stamp>
            </div>
            <ul className="mt-5 space-y-3">
              {h.fit.bad.map((b) => (
                <li key={b} className="flex gap-3 text-[15.5px] text-[color:var(--ink-soft)]">
                  <X className="mt-1 size-4 shrink-0 text-[color:var(--reject)]" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------ CTA ---------------------------------- */}
      <Section id="apply-cta" tight>
        <Card className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title as="h2">{h.cta.title}</Title>
            <Lead>{h.cta.lead}</Lead>
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
