import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAYBOOK } from "@/content/public-site";
import { Eyebrow, Lead, PublicButton, Section, Title } from "@/components/public/primitives";
import { Reveal } from "@/components/marketing/reveal";
import { ChapterArt } from "./chapter-art";

export const metadata: Metadata = {
  title: "The Founder Authority System",
  description: PLAYBOOK.lead,
  alternates: { canonical: "/playbook" },
};

export default function PlaybookIndex() {
  return (
    <>
      <section className="tl-section pb-8">
        <div className="tl-container">
          <Eyebrow>{PLAYBOOK.eyebrow}</Eyebrow>
          <h1 className="tl-display max-w-[14ch]">{PLAYBOOK.title}</h1>
          <Lead>{PLAYBOOK.lead}</Lead>
          <div className="mt-8">
            <PublicButton href={`/playbook/${PLAYBOOK.chapters[0].slug}`} primary size="lg">
              Start reading
              <ArrowRight className="size-5" aria-hidden />
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

      <Section>
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
