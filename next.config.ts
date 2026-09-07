import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'personalcarebd.com',
      },
    ],
  },
};

export default nextConfig;
