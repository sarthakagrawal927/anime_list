import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — posters rarely change
    formats: ["image/avif", "image/webp"],
    loader: "custom",
    loaderFile: "./lib/loaders/imageLoader.ts",
  },
};

export default nextConfig;
