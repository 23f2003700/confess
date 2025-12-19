import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.catbox.moe',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.catbox.moe',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'litter.catbox.moe',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mymbm-confessions-images.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
    // Minimize image processing overhead for external images
    minimumCacheTTL: 86400, // Cache for 24 hours
    dangerouslyAllowSVG: false,
  },
};

export default nextConfig;
