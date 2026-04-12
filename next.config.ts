import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow large file uploads for Hevy CSV
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
