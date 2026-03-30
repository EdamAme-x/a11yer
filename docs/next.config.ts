import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/a11yer",
  images: { unoptimized: true },
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
