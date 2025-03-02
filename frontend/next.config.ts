import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'pbs.twimg.com',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'arweave.net',
      'ipfs-gateway.cloud',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;