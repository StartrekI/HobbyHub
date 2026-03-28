import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 3600, // 1 hour (was 60s)
  },
  experimental: {
    serverMinification: true,
    // Tree-shake framer-motion (large library)
    optimizePackageImports: ["framer-motion"],
    // Cache client-side navigations for SPA-feel smoothness
    staleTimes: {
      dynamic: 15,  // 15s for dynamic pages (not refetched on every nav)
      static: 300,  // 5min for static segments
    },
  },
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
    {
      // Immutable cache for static assets (fonts, images, CSS/JS chunks)
      source: "/:all*(svg|jpg|png|webp|avif|woff2|woff|ttf|css|js)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
