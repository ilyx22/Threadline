import type { Metadata } from "next";
import { SITE } from "@/content/public-site";
import { hero } from "@/content/marketing-site";
import Hero from "@/components/marketing-v4/Hero";
import ProblemSection from "@/components/marketing-v4/ProblemSection";
import MemorySection from "@/components/marketing-v4/MemorySection";
import ValueGrid from "@/components/marketing-v4/ValueGrid";
import BurdenSection from "@/components/marketing-v4/BurdenSection";
import WorkshopSection from "@/components/marketing-v4/WorkshopSection";
import ExpressionsSection from "@/components/marketing-v4/ExpressionsSection";
import MovementSection from "@/components/marketing-v4/MovementSection";
import DiagnosisSection from "@/components/marketing-v4/DiagnosisSection";
import CycleSection from "@/components/marketing-v4/CycleSection";
import ComparisonSection from "@/components/marketing-v4/ComparisonSection";
import FitSection from "@/components/marketing-v4/FitSection";
import ClosingSection from "@/components/marketing-v4/ClosingSection";

export const metadata: Metadata = {
  title: { absolute: `Threadline — ${hero.headline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: `Threadline — ${hero.headline}`, description: SITE.description, url: "/", type: "website" },
};

/**
 * v4 (12 September 2026): the signature marketing experience, ported from the
 * `thebirdhouse/` workspace (threadline-marketing-v3) and finished here. The
 * running order is the buyer's sequence of thoughts:
 *
 *   identification (hero) → problem (the expertise vault) → desired state
 *   (market memory) → the system at a glance (six cells) → burden relief
 *   (talk · record · approve · sell) → mechanism (the Authority Workshop) →
 *   format intelligence (one idea, the right expressions) → commercial
 *   movement → learning (expected → actual) → the twelve-week cycle →
 *   comparison → fit → action.
 *
 * Every sentence comes from `src/content/marketing-site.ts`; the illustrative
 * content is labelled on the page; nothing here prices or promises.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <MemorySection />
      <ValueGrid />
      <BurdenSection />
      <WorkshopSection />
      <ExpressionsSection />
      <MovementSection />
      <DiagnosisSection />
      <CycleSection />
      <ComparisonSection />
      <FitSection />
      <ClosingSection />
    </>
  );
}
