import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'carezonebd.store',
      },
      {
        protocol: 'https',
        hostname: 'www.carezonebd.store',
      },
      {
        protocol: 'https',
        hostname: 'selfcaresolution.online',
      },
      {
        protocol: 'https',
        hostname: 'www.selfcaresolution.online',
      },
    ],
  },
};

export default nextConfig;
