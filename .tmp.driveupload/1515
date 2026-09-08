import type { Metadata } from "next";
import { CalculatorClient } from "./calculator-client";

export const metadata: Metadata = {
  title: "Content operating cost calculator",
  description:
    "Work out what your current content operation costs, using your own figures. A scenario, not a projection.",
};

export default function CalculatorPage() {
  return (
    <div className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="text-eyebrow mb-4 text-accent">Cost calculator</p>
          <h1 className="text-hero">What does your content operation actually cost?</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">
            Most founders have never costed this properly, because the largest line — their own
            time — never appears on an invoice. Put your real numbers in and see the whole figure.
          </p>
        </header>

        <CalculatorClient />
      </div>
    </div>
  );
}
