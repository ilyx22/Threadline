import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HOME, WHO_ITS_FOR } from "@/content/public-site";
import { Card, Eyebrow, Lead, PublicButton, Section, Title } from "@/components/public/primitives";
import { VerdictTile } from "@/components/factory/objects";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Who it is for",
  description: "Threadline works when there is real expertise, a real offer and enough value per customer that one good conversation matters.",
  alternates: { canonical: "/who-its-for" },
};

export default function WhoItsForPage() {
  const c = WHO_ITS_FOR;
  return (
    <>
      <StickyApply showAfter={500} />
      <section className="tl-section pb-8">
        <div className="tl-container">
          <Eyebrow className="text-[color:var(--accent-deep)]">Who it is for</Eyebrow>
          <h1 className="tl-display max-w-[16ch]">{c.title}</h1>
          <Lead>{c.lead}</Lead>
        </div>
      </section>

      <Section band className="pt-8">
        <dl className="grid gap-x-12 md:grid-cols-2">
          {c.profile.map((p, i) => (
            <Reveal key={p.label} delay={(i % 2) * 60} className="border-t border-[color:var(--line)] py-6">
              <dt className="tl-label text-[color:var(--accent-deep)]">{p.label}</dt>
              <dd className="tl-body mt-3 text-[15.5px]">{p.body}</dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-8 max-w-3xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{c.wedgeNote}</p>
      </Section>

      <Section>
        <Eyebrow>Plainly</Eyebrow>
        <Title>The fit, in one look.</Title>
        <div className="tl-fit mt-10">
          <div>
            <p className="tl-label text-[color:var(--signal)]">A good fit</p>
            <ul>
              {HOME.fit.good.map((g) => (
                <VerdictTile key={g} yes>
                  {g}
                </VerdictTile>
              ))}
            </ul>
          </div>
          <div>
            <p className="tl-label text-[color:var(--reject)]">Not a fit</p>
            <ul>
              {HOME.fit.bad.map((b) => (
                <VerdictTile key={b} yes={false}>
                  {b}
                </VerdictTile>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section band tight>
        <Card className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title>Not sure? Apply and find out.</Title>
            <Lead>The application is a diagnostic. If the honest answer is that Threadline is the wrong tool for your business, we will say so — and you keep the finding.</Lead>
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
