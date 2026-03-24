import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // turbopack: {
    //   resolveAlias: {
    //     // This is required to make tailwind-variants work with turbopack
    //     // See https://github.com/nextui-org/nextui/issues/1468
    //     "tailwind-variants": "tailwind-variants/dist/index.mjs",
    //   },
    // },
  },
  allowedDevOrigins: ["10.234.16.80"],
};

export default nextConfig;
