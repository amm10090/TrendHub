const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        middlewarePrefetch: 'flexible'
    },
    transpilePackages: ["@heroui/button", "@heroui/link"]
};

module.exports = withNextIntl(nextConfig);
