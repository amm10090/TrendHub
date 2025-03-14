import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@heroui/react"],
};

export default withNextIntl(nextConfig);
