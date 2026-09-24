import type { Metadata } from "next";
import WhoItsFor from "@/components/marketing-v9/WhoItsFor";

export const metadata: Metadata = {
  title: "Who it is for",
  description: "Threadline works when there is real expertise, a real offer and enough value per customer that one good conversation matters.",
  alternates: { canonical: "/who-its-for" },
};

/** Who it is for, in the homepage's system (24 September 2026). */
export default function WhoItsForPage() {
  return <WhoItsFor />;
}
