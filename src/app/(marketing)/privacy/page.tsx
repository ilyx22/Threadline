import type { Metadata } from "next";
import { PRIVACY } from "@/content/legal";
import { LegalPage } from "@/components/marketing-v9/Legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: PRIVACY.lead,
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
