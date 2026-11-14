import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolate QA's Next.js build from the DEV server in the same checkout.
  distDir: process.env.QM_NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
