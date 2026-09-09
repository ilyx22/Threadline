import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/how-it-works", "/who-its-for", "/playbook", "/apply", "/calculator"], disallow: ["/app", "/admin", "/onboarding", "/api", "/t/", "/login", "/invite", "/reset-password", "/forgot-password"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
