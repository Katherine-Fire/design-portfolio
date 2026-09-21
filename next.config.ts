import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

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