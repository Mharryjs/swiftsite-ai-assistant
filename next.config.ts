import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runtime media is created after deployment and must never be copied into a
  // server trace. Keep the ffmpeg executable explicitly included instead.
  outputFileTracingExcludes: {
    "/api/generate": [
      "./.data/**/*",
      "./.env*",
      "./README.md",
      "./next.config.ts",
      "./drizzle.config.ts",
      "./public/**/*",
    ],
  },
  outputFileTracingIncludes: {
    "/api/generate": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
