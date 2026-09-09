import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HOW_IT_WORKS, STATIONS } from "@/content/public-site";
import { Card, Chip, Eyebrow, Lead, PublicButton, Section, Stamp, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";
import { MachineLine } from "@/components/factory/machine";
import { AssemblyStation, BuilderStation, Buyer, Conveyor, DistributionSorter, FeedbackPipe, Founder, ScannerStation } from "@/components/factory/primitives";

export const metadata: Metadata = {
  title: "How it works",
  description: "Raw expertise in. Market intelligence, content decisions, production, distribution, commercial response and learning — in that order, every service period.",
  alternates: { canonical: "/how-it-works" },
};

const ART: Record<string, React.ReactNode> = {
  founder: <Founder className="w-[72px]" />,
  scanner: <ScannerStation className="w-[130px]" />,
  assembly: <AssemblyStation className="w-[130px]" />,
  builder: <BuilderStation className="w-[130px]" />,
  sorter: <DistributionSorter className="w-[130px]" />,
  buyer: <Buyer className="w-[72px]" />,
  pipe: <FeedbackPipe width={320} className="w-[220px]" />,
};

export default function HowItWorksPage() {
  const c = HOW_IT_WORKS;
  return (
    <>
      <StickyApply showAfter={500} />
      <section className="tl-section pb-8">
        <div className="tl-container">
          <Eyebrow>How it works</Eyebrow>
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
        <ol className="space-y-6">
          {c.stages.map((s, i) => (
            <Reveal key={s.key} as="li">
              <div className="grid gap-6 rounded-[20px] border-[1.5px] border-[color:var(--ink)] bg-[color:var(--paper)] p-6 sm:p-8 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                <div className="flex items-center justify-center">{ART[s.station]}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tl-label text-[color:var(--accent-deep)]">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="tl-sub-title">{s.title}</h2>
                  </div>
                  <p className="tl-body mt-3">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
        <Conveyor className="mt-8" slow />
      </Section>

      <Section band>
        <Eyebrow>Gates</Eyebrow>
        <Title>Four things the machine refuses to do.</Title>
        <Lead>Each gate is a rule in the software, not a policy in a document. They exist so that a fast operation cannot become a careless one.</Lead>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {c.gates.map((g, i) => (
            <Reveal key={g.label} delay={i * 60} as="li">
              <Card quiet className="flex h-full gap-4">
                <Stamp className="shrink-0 self-start">Gate</Stamp>
                <div>
                  <p className="tl-sub-title text-[1.125rem]">{g.label}</p>
                  <p className="tl-body mt-2 text-[14.5px]">{g.body}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="tl-card grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title>See it run on your business.</Title>
            <Lead>Apply for a diagnosis. We read every application and reply either way.</Lead>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip>£2,500 implementation</Chip>
              <Chip>£2,500 every 4 weeks</Chip>
              <Chip>12-week initial engagement</Chip>
            </div>
          </div>
          <PublicButton href="/apply" primary size="lg">
            Apply
            <ArrowRight className="size-5" aria-hidden />
          </PublicButton>
        </div>
      </Section>
    </>
  );
}
