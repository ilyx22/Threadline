import type { Metadata } from "next";
import { TERMS } from "@/content/legal";
import { LegalPage } from "@/components/marketing-v9/Legal";

export const metadata: Metadata = {
  title: "Terms of use",
  description: TERMS.lead,
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
