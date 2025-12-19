import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
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
  },
};

export default nextConfig;
