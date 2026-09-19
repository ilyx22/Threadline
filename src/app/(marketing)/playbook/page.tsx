import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIAGNOSTIC, HOME_V3, HOW_IT_WORKS, PLAYBOOK, PLAYBOOK_TOOLS } from "@/content/public-site";
import { Eyebrow, Lead, PublicButton, Section, Title } from "@/components/public/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { Diagnostic } from "@/components/public/diagnostic";
import { AcquisitionCalculator } from "@/components/marketing-v5/AcquisitionCalculator";
import { ChapterArt } from "./chapter-art";

export const metadata: Metadata = {
  title: "The Founder Authority System",
  description: PLAYBOOK.lead,
  alternates: { canonical: "/playbook" },
};

/**
 * The Playbook as a product: ten chapters to read, and two things to do —
 * diagnose where the authority system breaks, and model what a target
 * implies in first touches with the right buyers. Same object language as the
 * homepage; the last chapter and the closing card hand over to Apply.
 */
export default function PlaybookIndex() {
  return (
    <>
      <section className="tl-section pb-8">
        <div className="tl-container">
          <Eyebrow>{PLAYBOOK.eyebrow}</Eyebrow>
          <h1 className="tl-display max-w-[14ch]">{PLAYBOOK.title}</h1>
          <Lead>{PLAYBOOK.lead}</Lead>
          <div className="mt-8 flex flex-wrap gap-3">
            <PublicButton href={`/playbook/${PLAYBOOK.chapters[0].slug}`} primary size="lg">
              Start reading
              <ArrowRight className="size-5" aria-hidden />
            </PublicButton>
            <PublicButton href="#tools" size="lg">
              Use the tools
            </PublicButton>
          </div>
        </div>
      </section>

      <Section band className="pt-8">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAYBOOK.chapters.map((ch, i) => (
            <Reveal key={ch.slug} delay={(i % 3) * 60} as="li">
              <Link href={`/playbook/${ch.slug}`} className="tl-card tl-card-hover flex h-full flex-col p-6 no-underline">
                <div className="flex items-center justify-between">
                  <span className="tl-label text-[color:var(--accent-deep)]">Chapter {String(i + 1).padStart(2, "0")}</span>
                  <ChapterArt scene={ch.scene} className="w-[64px]" />
                </div>
                <p className="tl-sub-title mt-4 text-[1.25rem] text-[color:var(--ink)]">{ch.title}</p>
                <p className="tl-body mt-2 text-[14.5px]">{ch.summary}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[14px] font-medium text-[color:var(--ink)]">
                  Read
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section id="tools">
        <Eyebrow className="text-[color:var(--accent-deep)]">{PLAYBOOK_TOOLS.eyebrow}</Eyebrow>
        <Title>{PLAYBOOK_TOOLS.title}</Title>
        <Lead>{PLAYBOOK_TOOLS.lead}</Lead>
        <div className="pb-tools mt-10">
          <Reveal as="section" className="pb-tool" aria-labelledby="tool-diagnose">
            <div className="pb-tool-head">
              <Eyebrow>{PLAYBOOK_TOOLS.diagnose.eyebrow}</Eyebrow>
              <h2 id="tool-diagnose" className="tl-sub-title text-[color:var(--ink)]">
                {PLAYBOOK_TOOLS.diagnose.title}
              </h2>
              <p className="tl-body text-[15.5px]">{PLAYBOOK_TOOLS.diagnose.lead}</p>
            </div>
            <Diagnostic categories={DIAGNOSTIC.categories} chambers={HOME_V3.factory.chambers} stages={HOW_IT_WORKS.stages} symptoms={DIAGNOSTIC.symptoms} cta={DIAGNOSTIC.cta} />
          </Reveal>
          <Reveal as="section" className="pb-tool" aria-labelledby="tool-model">
            <div className="pb-tool-head">
              <Eyebrow>{PLAYBOOK_TOOLS.model.eyebrow}</Eyebrow>
              <h2 id="tool-model" className="tl-sub-title text-[color:var(--ink)]">
                {PLAYBOOK_TOOLS.model.title}
              </h2>
              <p className="tl-body text-[15.5px]">{PLAYBOOK_TOOLS.model.lead}</p>
            </div>
            <AcquisitionCalculator />
          </Reveal>
        </div>
      </Section>

      <Section band>
        <div className="tl-card grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title>{PLAYBOOK.closing.title}</Title>
            <Lead>{PLAYBOOK.closing.lead}</Lead>
          </div>
          <PublicButton href={PLAYBOOK.closing.cta.href} primary size="lg">
            {PLAYBOOK.closing.cta.label}
            <ArrowRight className="size-5" aria-hidden />
          </PublicButton>
        </div>
      </Section>
    </>
  );
}
