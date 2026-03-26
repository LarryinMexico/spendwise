import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {},
  allowedDevOrigins: ["10.234.16.80"],
};

export default nextConfig;
