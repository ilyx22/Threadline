import type { Metadata } from "next";
import { SITE } from "@/content/public-site";
import { hero } from "@/content/marketing-v5";
import Motion from "@/components/marketing-v5/Motion";
import { Burden, Closing, Diagnosis, Engagement, Fit, Hero, Problem, Workshop } from "@/components/marketing-v5/Sections";

export const metadata: Metadata = {
  title: { absolute: `Threadline — ${hero.headline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: `Threadline — ${hero.headline}`, description: SITE.description, url: "/", type: "website" },
};

/**
 * v5 (19 September 2026, review pass): the illustrated Threadline world in
 * eight scenes. The hero; the problem and the outcome it is solved for; one
 * illustrative engagement, so the purchase is tangible before the mechanism;
 * the founder's four jobs beside the busy workshop; the workshop bench; the
 * testing bench; the fit, with the comparison; the closing callback. One
 * continuous thread runs the page. Every sentence comes from
 * `src/content/marketing-v5.ts`; illustrative content is labelled on the page.
 */
export default function HomePage() {
  return (
    <>
      <Motion />
      <Hero />
      <Problem />
      <Engagement />
      <Burden />
      <Workshop />
      <Diagnosis />
      <Fit />
      <Closing />
    </>
  );
}
