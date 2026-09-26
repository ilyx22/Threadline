import type { Metadata } from "next";
import { CalculatorClient } from "./calculator-client";
import { CALCULATOR } from "@/content/public-site";
import { WordmarkMarquee } from "@/components/marketing-v9/Marquee";

export const metadata: Metadata = {
  title: "The cost of the status quo",
  description: "Work out what your current content operation costs, using your own figures. A scenario, not a projection, and never a revenue forecast.",
  alternates: { canonical: "/calculator" },
};

/**
 * Retained after audit: it answers a question founders genuinely have not
 * costed (their own time) and it refuses to project revenue. A supporting
 * tool reached from the footer, in the homepage's system.
 */
export default function CalculatorPage() {
  return (
    <div className="v9-home ap-page">
      <section className="v9-hero" aria-labelledby="calc-title">
        <div className="v9-panel ap-panel is-single">
          <header className="ap-head">
            <p className="v9-eyebrow">{CALCULATOR.eyebrow}</p>
            <h1 id="calc-title" className="v9-h1">
              {CALCULATOR.title}
            </h1>
            <p className="v9-lead">{CALCULATOR.lead}</p>
          </header>
          <div className="ap-form calc-wrap">
            <h2 className="v9-visually-hidden">Your figures and what they cost</h2>
            <CalculatorClient />
          </div>
        </div>
      </section>
      <WordmarkMarquee />

    </div>
  );
}
