import type { Metadata } from "next";
import HowItWorks from "@/components/marketing-v9/HowItWorks";

export const metadata: Metadata = {
  title: "How it works",
  description: "Raw expertise in. Market intelligence, content decisions, production, distribution, commercial response and learning: in that order, every service period.",
  alternates: { canonical: "/how-it-works" },
};

/** How it works, in the homepage's system (24 September 2026). */
export default function HowItWorksPage() {
  return <HowItWorks />;
}
