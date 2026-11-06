import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'carezonebd.tech',
      },
      {
        protocol: 'https',
        hostname: 'www.carezonebd.tech',
      },
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
