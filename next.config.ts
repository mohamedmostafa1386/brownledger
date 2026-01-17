import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Skip typescript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default withNextIntl(nextConfig);
