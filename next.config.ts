import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
