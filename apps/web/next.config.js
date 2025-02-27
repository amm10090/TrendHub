import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    middlewarePrefetch: 'flexible',
  },
  transpilePackages: ['@heroui/button', '@heroui/link'],
};

export default withNextIntl(nextConfig);
