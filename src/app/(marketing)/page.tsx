import type { Metadata } from "next";
import { HOME_V3, SITE } from "@/content/public-site";
import { Eyebrow, Lead, Section, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { HeroPanel } from "@/components/public/hero-panel";
import { HeroMachine } from "@/components/public/hero-machine";
import { ProblemContrast } from "@/components/public/problem-contrast";
import { BuyerPool } from "@/components/public/buyer-pool";
import { LabourSplit } from "@/components/public/labour-split";
import { Factory } from "@/components/public/factory";
import { Expressions } from "@/components/public/expressions";
import { RouteBoard } from "@/components/public/route-board";
import { LearningLoop } from "@/components/public/learning-loop";
import { Progression } from "@/components/public/progression";
import { Comparison } from "@/components/public/comparison";
import { FinalCta } from "@/components/public/final-cta";
import { TextLink } from "@/components/public/primitives";
import { VerdictTile } from "@/components/factory/objects";

export const metadata: Metadata = {
  title: "Threadline — you already have the expertise",
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: "Threadline — you already have the expertise", description: SITE.tagline, url: "/", type: "website" },
};

/**
 * v3 (9 Sept 2026, evening — the captivation pass). Narrative order:
 * problem → desired outcome → low founder burden → simple system → commercial
 * path → learning → progression → comparison → fit → CTA. Every approved
 * sentence survives; system detail lives on How it works. See
 * docs/design/CAPTIVATION_PASS_PLAN_2026-09-09.md.
 */
export default function HomePage() {
  const h = HOME_V3;
  return (
    <>
      <StickyApply />

      {/* 01 — Hero */}
      <HeroPanel eyebrow={h.hero.eyebrow} title={[h.hero.title[0], h.hero.title[1]]} lead={h.hero.lead} sub={h.hero.sub} note={h.hero.note} primary={h.hero.primary} secondary={h.hero.secondary} art={<div className="px-5 pb-5 lg:px-2 lg:pb-2"><HeroMachine m={h.hero.machine} /></div>} />

      {/* 02 — Commercial problem */}
      <Section id="problem">
        <Eyebrow className="text-[color:var(--accent-deep)]">{h.problem.eyebrow}</Eyebrow>
        <Title>{h.problem.title}</Title>
        <Lead>{h.problem.lead}</Lead>
        <ProblemContrast without={h.problem.without} with={h.problem.with} />
      </Section>

      {/* 03 — Desired outcome / market memory */}
      <Section id="memory" band>
        <Eyebrow>{h.memory.eyebrow}</Eyebrow>
        <Title className="max-w-[24ch]">{h.memory.title}</Title>
        <Lead>{h.memory.lead}</Lead>
        <BuyerPool stages={h.memory.stages} poolLabel={h.memory.poolLabel} encountersLabel={h.memory.encountersLabel} cards={h.memory.cards} />
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.memory.note}</p>
      </Section>

      {/* 04 — Founder burden */}
      <Section id="labour">
        <Eyebrow className="text-[color:var(--accent-deep)]">{h.labour.eyebrow}</Eyebrow>
        <Title>{h.labour.title}</Title>
        <Lead>{h.labour.lead}</Lead>
        <LabourSplit you={h.labour.you} threadline={h.labour.threadline} relief={h.labour.relief} />
      </Section>

      {/* 05 — Authority Factory */}
      <Section id="factory-section" band>
        <Eyebrow>{h.factory.eyebrow}</Eyebrow>
        <Title className="max-w-[22ch]">{h.factory.title}</Title>
        <Lead>{h.factory.lead}</Lead>
        <Factory chambers={h.factory.chambers} loop={h.factory.loop} />
      </Section>

      {/* 06 — One idea, the right expressions */}
      <Section id="expressions">
        <Eyebrow>{h.expressions.eyebrow}</Eyebrow>
        <Title>{h.expressions.title}</Title>
        <Lead>{h.expressions.lead}</Lead>
        <Expressions thesis={h.expressions.thesis} outputs={h.expressions.outputs} action={h.expressions.action} reset={h.expressions.reset} caveat={h.expressions.caveat} />
      </Section>

      {/* 07 — Attention → commercial movement */}
      <Section id="route" band>
        <Eyebrow>{h.route.eyebrow}</Eyebrow>
        <Title>{h.route.title}</Title>
        <Lead>{h.route.lead}</Lead>
        <RouteBoard steps={h.route.steps} quote={h.route.quote} left={h.route.left} right={h.route.right} honesty={h.route.honesty} illustrative={h.route.illustrative} />
      </Section>

      {/* 08 — Learning loop */}
      <Section id="learning">
        <Eyebrow className="text-[color:var(--accent-deep)]">{h.learning.eyebrow}</Eyebrow>
        <Title>{h.learning.title}</Title>
        <Lead>{h.learning.lead}</Lead>
        <LearningLoop asset={h.learning.asset} states={h.learning.states} />
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.learning.disclaimer}</p>
      </Section>

      {/* 09 — 12-week progression */}
      <Section id="twelve-weeks" band>
        <Eyebrow>{h.progression.eyebrow}</Eyebrow>
        <Title>{h.progression.title}</Title>
        <Lead>{h.progression.lead}</Lead>
        <Progression periods={h.progression.periods} legend={h.progression.legend} />
        <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{h.progression.note}</p>
      </Section>

      {/* 10 — Comparison */}
      <Section id="comparison">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>{h.comparison.eyebrow}</Eyebrow>
          <Title className="mx-auto">{h.comparison.title}</Title>
          <Lead className="mx-auto">{h.comparison.lead}</Lead>
        </div>
        <Comparison columns={h.comparison.columns} rows={h.comparison.rows} note={h.comparison.note} />
      </Section>

      {/* 11 — Who it is / is not for */}
      <Section id="fit" band>
        <Eyebrow>{h.fit.eyebrow}</Eyebrow>
        <Title>{h.fit.title}</Title>
        <div className="tl-fit">
          <div>
            <p className="tl-label text-[color:var(--signal)]">A good fit</p>
            <ul>
              {h.fit.good.map((g) => (
                <VerdictTile key={g} yes>
                  {g}
                </VerdictTile>
              ))}
            </ul>
          </div>
          <div>
            <p className="tl-label text-[color:var(--reject)]">Not a fit</p>
            <ul>
              {h.fit.bad.map((b) => (
                <VerdictTile key={b} yes={false}>
                  {b}
                </VerdictTile>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8">
          <TextLink href={h.fit.more.href}>{h.fit.more.label}</TextLink>
        </p>
      </Section>

      {/* 12 — Final CTA */}
      <Section id="apply-cta" tight>
        <FinalCta title={h.cta.title} lead={h.cta.lead} outputs={h.cta.outputs} action={h.cta.action} />
      </Section>
    </>
  );
}
