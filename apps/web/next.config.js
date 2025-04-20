import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@heroui/react'],
  // Analytics 和 Speed Insights 已通过组件方式集成

  // 添加以下配置，优化性能和客户端导航
  poweredByHeader: false,
  compress: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // 禁用严格模式，避免开发环境中的双重渲染
  // 注意：仅在调试期间禁用，解决问题后应重新启用
  // reactStrictMode: false,

  // 优化客户端导航
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // 将turbo配置从experimental中移出
  turbopack: true,

  // 优化图片加载
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 添加自定义headers，解决可能的CORS问题
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
