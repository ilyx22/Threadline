/**
 * The site's own origin, for canonical URLs, the sitemap, tokens and OAuth.
 *
 * `NEXT_PUBLIC_APP_URL` wins when it is set to a real value. An empty string
 * (which hosting dashboards happily save) is treated as unset — `??` alone
 * would pass it straight into `new URL("")` and fail the build. On Vercel the
 * platform's own variables give a working origin before a custom domain
 * exists; locally it is the dev server.
 */
export function appUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  const vercel = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "").trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}
