import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: { optimizePackageImports: ["@phosphor-icons/react"] },
};

export default nextConfig;
