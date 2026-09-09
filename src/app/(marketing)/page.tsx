import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { HOME, SITE } from "@/content/public-site";
import { Card, Chip, Eyebrow, Lead, Mark, PublicButton, Section, Stamp, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";
import { MachineLine } from "@/components/factory/machine";
import { AttentionScene, BranchingScene, HeroScene, LearningCard, MemoryScene, ProblemScene, ProofChain, ReturnLoopScene } from "@/components/factory/scenes";
import { Buyer, Founder, Operator } from "@/components/factory/primitives";

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
 */
export default function HomePage() {
  const h = HOME;
  return (
    <>
      <StickyApply />

      {/* ----------------------------------- Hero ---------------------------------- */}
      <section className="tl-section relative overflow-hidden pb-10 pt-12 sm:pt-16 lg:pb-16 lg:pt-20">
        <div className="tl-container grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <Eyebrow>{h.hero.eyebrow}</Eyebrow>
            <h1 className="tl-display">
              {h.hero.title[0]}
              <br />
              <Mark>{h.hero.title[1]}</Mark>
            </h1>
            <p className="tl-lead mt-7">{h.hero.lead}</p>
            <p className="mt-5 text-[17px] font-medium text-[color:var(--ink)]">{h.hero.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PublicButton href={SITE.primaryCta.href} primary size="lg">
                {SITE.primaryCta.label}
                <ArrowRight className="size-5" aria-hidden />
              </PublicButton>
              <PublicButton href={SITE.secondaryCta.href} size="lg">
                {SITE.secondaryCta.label}
              </PublicButton>
            </div>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-[color:var(--ink-faint)]">{h.hero.note}</p>
          </div>
          <div className="tl-card min-w-0 p-5 sm:p-7">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* --------------------------------- Problem --------------------------------- */}
      <Section id="problem" band>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <Eyebrow>{h.problem.eyebrow}</Eyebrow>
            <Title>{h.problem.title}</Title>
            <Lead>{h.problem.lead}</Lead>
          </div>
          <Reveal>
            <ProblemScene crates={h.problem.crates} />
          </Reveal>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {h.problem.points.map((p, i) => (
            <Reveal key={p.title} delay={i * 60} as="li">
              <Card quiet className="h-full">
                <p className="tl-sub-title text-[1.125rem]">{p.title}</p>
                <p className="tl-body mt-2 text-[14.5px]">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ------------------------------ Four things -------------------------------- */}
      <Section id="four-things">
        <Eyebrow>{h.fourThings.eyebrow}</Eyebrow>
        <Title>{h.fourThings.title}</Title>
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="relative">
            <div className="flex items-center gap-3">
              <Founder className="w-[48px]" />
              <p className="tl-label">You</p>
            </div>
            <ol className="mt-6 space-y-5">
              {h.fourThings.you.map((y, i) => (
                <li key={y.label} className="flex gap-4">
                  <span className="tl-display shrink-0 text-[2rem] leading-none text-[color:var(--accent)]" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <p className="tl-sub-title text-[1.25rem]">{y.label}</p>
                    <p className="tl-body mt-1 text-[14.5px]">{y.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card quiet className="bg-[color:var(--canvas-deep)]">
            <div className="flex items-center gap-3">
              <Operator className="w-[48px]" />
              <p className="tl-label">Threadline</p>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="What Threadline handles">
              {h.fourThings.machine.map((m) => (
                <li key={m}>
                  <Chip>{m}</Chip>
                </li>
              ))}
            </ul>
            <p className="tl-body mt-6">{h.fourThings.relief}</p>
          </Card>
        </div>
      </Section>

      {/* -------------------------------- The machine ------------------------------- */}
      <Section id="machine" band>
        <Eyebrow>{h.machine.eyebrow}</Eyebrow>
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
      <Section id="expressions" band>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <Eyebrow>{h.branching.eyebrow}</Eyebrow>
            <Title>{h.branching.title}</Title>
            <Lead>{h.branching.lead}</Lead>
          </div>
          <Reveal>
            <Card>
              <BranchingScene packages={h.branching.packages} />
            </Card>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------ Market memory ------------------------------ */}
      <Section id="memory">
        <Eyebrow>{h.memory.eyebrow}</Eyebrow>
        <Title className="max-w-[22ch]">{h.memory.title}</Title>
        <Lead>{h.memory.lead}</Lead>
        <Reveal>
          <div className="tl-card mt-12 p-6 sm:p-10">
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <Eyebrow>{h.learns.eyebrow}</Eyebrow>
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
        <ol className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {h.twelveWeeks.periods.map((p, i) => (
            <Reveal key={p.label} delay={i * 70} as="li">
              <Card quiet={i === 3} className={i === 3 ? "h-full border-dashed" : "h-full"}>
                <p className="tl-label text-[color:var(--accent-deep)]">{p.label}</p>
                <p className="tl-sub-title mt-3 text-[1.25rem]">{p.title}</p>
                <p className="tl-body mt-2 text-[14.5px]">{p.body}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
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
      <Section id="fit" band>
        <Eyebrow>{h.fit.eyebrow}</Eyebrow>
        <Title>{h.fit.title}</Title>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="tl-label">A good fit</p>
              <Stamp tone="signal">Yes</Stamp>
            </div>
            <ul className="mt-5 space-y-3">
              {h.fit.good.map((g) => (
                <li key={g} className="flex gap-3 text-[15px] text-[color:var(--ink)]">
                  <Check className="mt-1 size-4 shrink-0 text-[color:var(--signal)]" aria-hidden />
                  {g}
                </li>
              ))}
            </ul>
          </Card>
          <Card quiet>
            <div className="flex items-center justify-between gap-3">
              <p className="tl-label text-[color:var(--ink-faint)]">Not a fit</p>
              <Stamp tone="reject">Not yet</Stamp>
            </div>
            <ul className="mt-5 space-y-3">
              {h.fit.bad.map((b) => (
                <li key={b} className="flex gap-3 text-[15px] text-[color:var(--ink-soft)]">
                  <X className="mt-1 size-4 shrink-0 text-[color:var(--reject)]" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------ CTA ---------------------------------- */}
      <Section id="apply-cta">
        <div className="tl-card grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title as="h2">{h.cta.title}</Title>
            <Lead>{h.cta.lead}</Lead>
          </div>
          <div className="flex flex-col items-start gap-4">
            <PublicButton href="/apply" primary size="lg">
              Apply
              <ArrowRight className="size-5" aria-hidden />
            </PublicButton>
            <div className="flex items-end gap-2" aria-hidden>
              <Buyer className="w-[44px]" />
              <Operator className="w-[44px]" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
