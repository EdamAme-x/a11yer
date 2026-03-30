import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/a11yer",
  images: { unoptimized: true },
  // Turbopack resolve alias for local a11yer
  experimental: {
    turbo: {
      resolveAlias: {
        a11yer: path.resolve(__dirname, "../dist/index.js"),
      },
    },
  },
  // Webpack fallback (when turbopack is not used)
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      a11yer: path.resolve(__dirname, "../dist/index.js"),
    };
    return config;
  },
};

export default nextConfig;
