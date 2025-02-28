import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@heroui/react", "@heroui/button", "@heroui/link", "@heroui/toast"]
};

export default withNextIntl(nextConfig);
