import type { Metadata } from "next";
import { SITE } from "@/content/public-site";
import { hero } from "@/content/home";
import Home from "@/components/home/Home";

export const metadata: Metadata = {
  title: { absolute: `Threadline — ${hero.headline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: `Threadline — ${hero.headline}`, description: SITE.description, url: "/", type: "website" },
};

/**
 * The homepage, 24 September 2026: eight parts in one narrative — proposition
 * and fit, the visibility gap, market memory, the working relationship, the
 * Authority Workshop, one idea and its expressions, commercial learning, fit
 * and action. Copy lives in `src/content/home.ts`.
 */
export default function HomePage() {
  return <Home />;
}
