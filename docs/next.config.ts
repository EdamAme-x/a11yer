import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/a11yer",
  images: { unoptimized: true },
};

export default nextConfig;
