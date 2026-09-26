import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy (SEC-04).
 *
 * Every script, style, font and connection comes from this origin; nothing is
 * loaded from a third party. `script-src 'unsafe-inline'` is required by the
 * Next.js App Router's inline bootstrap on statically rendered pages (a nonce
 * would force every public page to render dynamically); the rest of the policy
 * still blocks third-party scripts, plugins, framing, <base> hijacking and
 * form posts off-site. Images may come from https: because content thumbnails
 * are links the operator pastes. A direct-to-storage upload origin is added
 * when S3_ENDPOINT is set.
 */
const storageOrigin = (() => {
  try {
    return process.env.S3_ENDPOINT ? new URL(process.env.S3_ENDPOINT).origin : "";
  } catch {
    return "";
  }
})();
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${storageOrigin ? ` ${storageOrigin}` : ""}${isProd ? "" : " ws: wss:"}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, subdomains included. Not submitted to the preload list: that is
  // hard to undo and belongs to the owner once the custom domain is settled.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets a QA production build live beside a running dev server
  // instead of racing it for `.next` (default unchanged).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client"],
  // The sales-script import reads the draft working documents at run time
  // (COM-07); without this they are not shipped with the function on Vercel.
  outputFileTracingIncludes: {
    "/admin/scripts": ["./Threadline Final Working Resources/03 Acquisition and Sales/DRAFT_*.md"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async redirects() {
    return [
      { source: "/playbook/repeated-exposure-builds-memory", destination: "/playbook/distribution-is-a-place-not-a-blast", permanent: true },
      { source: "/playbook/measure-what-the-buyer-did", destination: "/playbook/write-down-what-you-expect", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
