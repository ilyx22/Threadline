import type { Metadata } from "next";
import { PLAYBOOK } from "@/content/public-site";
import Playbook from "@/components/marketing-v9/playbook/Playbook";

export const metadata: Metadata = {
  title: "The Founder Authority System",
  description: PLAYBOOK.lead,
  alternates: { canonical: "/playbook" },
};

/**
 * The Playbook as one interactive page (24 September 2026): ten chapters,
 * each with something to do, two tools, the three periods of a first
 * engagement, and the hand-over to the application. Chapters keep their own
 * routes at /playbook/[chapter] for deep links.
 */
export default function PlaybookIndex() {
  return <Playbook />;
}
