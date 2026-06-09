/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The Horizons export includes many diagnostic pages. Keep deploys unblocked during migration.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
