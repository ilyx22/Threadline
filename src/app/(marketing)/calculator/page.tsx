import type { Metadata } from "next";
import { CalculatorClient } from "./calculator-client";
import { CALCULATOR } from "@/content/public-site";
import { Eyebrow } from "@/components/public/primitives";

export const metadata: Metadata = {
  title: "The cost of the status quo",
  description: "Work out what your current content operation costs, using your own figures. A scenario, not a projection — and never a revenue forecast.",
  alternates: { canonical: "/calculator" },
};

/**
 * Retained after audit: it answers a question founders genuinely have not
 * costed (their own time) and it refuses to project revenue. Removed from the
 * primary navigation — it is a supporting tool, reached from the footer and
 * from the application's follow-up, not a destination.
 */
export default function CalculatorPage() {
  return (
    <div className="tl-section">
      <div className="tl-container">
        <header className="max-w-2xl">
          <Eyebrow>{CALCULATOR.eyebrow}</Eyebrow>
          <h1 className="tl-display max-w-[14ch] text-[clamp(2.25rem,4.6vw,3.75rem)]">{CALCULATOR.title}</h1>
          <p className="tl-lead mt-6 text-[17px]">{CALCULATOR.lead}</p>
        </header>
        <div className="mt-12">
          <h2 className="sr-only">Your figures and what they cost</h2>
          <CalculatorClient />
        </div>
      </div>
    </div>
  );
}
