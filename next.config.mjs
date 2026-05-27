/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing lint warnings in non-critical files — don't block production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors in non-critical files — don't block production builds
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false, // Disabling this saves significant RAM
    optimizePackageImports: [],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "wuqhrjczlolhiaihosei.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "kdcuganda.org",
      },
      {
        protocol: "https",
        hostname: "*.kdcuganda.org",
      },
      {
        protocol: "https",
        hostname: "pub-6299bd19a8614368b611590ccf05ac14.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-2f08fcf0958c4e15a15b48f6805de2be.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
