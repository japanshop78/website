import type { NextConfig } from "next";

// basePath chỉ dùng khi được truyền cụ thể (như GitHub Pages /website).
// Mặc định trên Cloudflare Pages, Custom domain hoặc Local luôn là "" (root).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;

