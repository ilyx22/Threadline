import type { Metadata } from "next";
import { SITE } from "@/content/public-site";
import { hero } from "@/content/marketing-v5";
import Motion from "@/components/marketing-v5/Motion";
import { Burden, Closing, Comparison, Cycle, Diagnosis, ExpressionsSection, Fit, Hero, Memory, Movement, Problem, Strip, Workshop } from "@/components/marketing-v5/Sections";

export const metadata: Metadata = {
  title: { absolute: `Threadline — ${hero.headline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: `Threadline — ${hero.headline}`, description: SITE.description, url: "/", type: "website" },
};

/**
 * v5 (19 September 2026): the illustrated Threadline world. One continuous
 * thread runs the page: drawn from the firm's archive in the hero, trapped in
 * the vault, tied in knots as a buyer remembers, wound and cut in the
 * workshop, fanned into expressions, followed down the street to a
 * conversation, tested on the bench, woven over twelve weeks, and back at the
 * archive, now visible, in the closing scene. Every sentence comes from
 * `src/content/marketing-v5.ts`; illustrative content is labelled on the page.
 */
export default function HomePage() {
  return (
    <>
      <Motion />
      <Hero />
      <Strip />
      <Problem />
      <Memory />
      <Burden />
      <Workshop />
      <ExpressionsSection />
      <Movement />
      <Diagnosis />
      <Cycle />
      <Comparison />
      <Fit />
      <Closing />
    </>
  );
}
