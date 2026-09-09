import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { HOME, WHO_ITS_FOR } from "@/content/public-site";
import { Card, Eyebrow, Lead, PublicButton, Section, Stamp, Title } from "@/components/public/primitives";
import { StickyApply } from "@/components/public/sticky-apply";
import { Reveal } from "@/components/marketing/reveal";
import { Buyer, Founder } from "@/components/factory/primitives";

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
        <div className="tl-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-end">
          <div>
            <Eyebrow>Who it is for</Eyebrow>
            <h1 className="tl-display max-w-[16ch]">{c.title}</h1>
            <Lead>{c.lead}</Lead>
          </div>
          <div className="flex items-end justify-end gap-3" aria-hidden>
            <Founder className="w-[64px]" />
            <Buyer className="w-[52px]" />
          </div>
        </div>
      </section>

      <Section band className="pt-8">
        <dl className="grid gap-4 md:grid-cols-2">
          {c.profile.map((p, i) => (
            <Reveal key={p.label} delay={(i % 2) * 60}>
              <Card quiet className="h-full">
                <dt className="tl-label text-[color:var(--accent-deep)]">{p.label}</dt>
                <dd className="tl-body mt-3 text-[15px]">{p.body}</dd>
              </Card>
            </Reveal>
          ))}
        </dl>
        <p className="mt-8 max-w-3xl text-[14.5px] leading-relaxed text-[color:var(--ink-faint)]">{c.wedgeNote}</p>
      </Section>

      <Section>
        <Eyebrow>Plainly</Eyebrow>
        <Title>The fit, in one look.</Title>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="tl-label">A good fit</p>
              <Stamp tone="signal">Yes</Stamp>
            </div>
            <ul className="mt-5 space-y-3">
              {HOME.fit.good.map((g) => (
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
              {HOME.fit.bad.map((b) => (
                <li key={b} className="flex gap-3 text-[15px] text-[color:var(--ink-soft)]">
                  <X className="mt-1 size-4 shrink-0 text-[color:var(--reject)]" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section band>
        <div className="tl-card grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Title>Not sure? Apply and find out.</Title>
            <Lead>The application is a diagnostic. If the honest answer is that Threadline is the wrong tool for your business, we will say so — and you keep the finding.</Lead>
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
