import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.selfcaresolution.online',
      },
      {
        protocol: 'https',
        hostname: 'selfcaresolution.online',
      },
      {
        protocol: 'https',
        hostname: 'selfcaresolution.vercel.app',
      },
    ],
  },
};

export default nextConfig;

