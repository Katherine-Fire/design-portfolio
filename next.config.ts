import type { NextConfig } from "next";
import { SITE_BASE_PATH } from "./lib/sitePath";

const nextConfig: NextConfig = {
  output: "export",
  basePath: SITE_BASE_PATH,
  assetPrefix: SITE_BASE_PATH,

  images: {
    unoptimized: true,
  },

  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["@vgpu/wgsl/loader-webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
