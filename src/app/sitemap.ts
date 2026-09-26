import type { MetadataRoute } from "next";
import { PLAYBOOK } from "@/content/public-site";
import { appUrl } from "@/lib/app-url";

const BASE = appUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["/", "/how-it-works", "/who-its-for", "/playbook", "/apply", "/calculator", "/privacy", "/terms", "/cookies"];
  return [
    ...routes.map((r) => ({ url: `${BASE}${r}`, lastModified: now, changeFrequency: "monthly" as const, priority: r === "/" ? 1 : 0.7 })),
    ...PLAYBOOK.chapters.map((c) => ({ url: `${BASE}/playbook/${c.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
