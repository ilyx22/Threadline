import type { NextConfig } from "next";

const securityHeaders = [
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
