import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
  turbopack: {
    // 如果有特定设置，放在这里
  },
  serverExternalPackages: ["playwright", "@crawlee/core"],
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {
      allowedOrigins: ["localhost:3001"],
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
};

export default withNextIntl(nextConfig);
