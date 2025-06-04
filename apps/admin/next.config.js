/* eslint-disable no-undef */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 解析 NEXT_PUBLIC_ALLOWED_DEV_ORIGINS 环境变量
const allowedDevOrigins = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
  ? JSON.parse(process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS)
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@heroui/react", "@heroui/dom-animation", "@repo/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  turbopack: {
    // 如果有特定设置，放在这里
  },
  serverExternalPackages: ["playwright", "@crawlee/core", "@prisma/client"],
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "127.0.0.1:3001",
        "82.25.95.136:3001", // 添加你的生产服务器IP
        ...allowedDevOrigins.map((ip) => `${ip}:3001`),
      ],
    },
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@heroui/dom-animation": "@heroui/dom-animation",
    };

    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored)
            ? config.watchOptions.ignored
            : []),
          "**/storage/**",
        ],
      };
    }

    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      config.externals.push("browserslist");
      config.externals.push("caniuse-lite");
      config.externals.push(/^@repo\/scraper(\/.*)?$/);
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
