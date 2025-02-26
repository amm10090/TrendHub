/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@trend-hub/ui", "@trend-hub/utils", "@trend-hub/types"]
};

module.exports = nextConfig; 