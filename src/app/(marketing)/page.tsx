import type { Metadata } from "next";
import { SITE } from "@/content/public-site";
import { hero } from "@/content/home";
import HomeV9 from "@/components/marketing-v9/Home";

export const metadata: Metadata = {
  title: { absolute: `Threadline: ${hero.headline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { title: `Threadline: ${hero.headline}`, description: SITE.description, url: "/", type: "website" },
};

/**
 * The homepage, 24 September 2026 (second pass): the pale-canvas, white-panel
 * composition with the illustrated Threadline world in every scene: hero,
 * ticker, the visibility gap, market memory, the working relationship, the
 * Authority Workshop mosaic, one idea and its expressions, the learning
 * bench, fit, the closing landscape. Copy in `src/content/home.ts` and the
 * station and bench copy in `src/content/marketing-v5.ts`.
 */
export default function HomePage() {
  return <HomeV9 />;
}
