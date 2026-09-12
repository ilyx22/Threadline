import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

const BASE = appUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/how-it-works", "/who-its-for", "/playbook", "/apply", "/calculator"], disallow: ["/app", "/admin", "/onboarding", "/api", "/t/", "/login", "/invite", "/reset-password", "/forgot-password"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
