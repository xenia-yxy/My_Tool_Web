import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
    ];
    const noStoreHeaders = [
      ...securityHeaders,
      { key: "Cache-Control", value: "no-store" },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/login",
        headers: noStoreHeaders,
      },
      {
        source: "/account/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/account/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/ai-model-configs/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/tools/outfit-image",
        destination: "/tools/menswear",
        permanent: true,
      },
      {
        source: "/tools/directory",
        destination: "/tools/sites",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
