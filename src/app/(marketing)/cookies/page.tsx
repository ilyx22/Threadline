import type { Metadata } from "next";
import { COOKIES } from "@/content/legal";
import { LegalPage } from "@/components/marketing-v9/Legal";

export const metadata: Metadata = {
  title: "Cookies and storage",
  description: COOKIES.lead,
  alternates: { canonical: "/cookies" },
};

export default function Page() {
  return <LegalPage doc={COOKIES} />;
}
