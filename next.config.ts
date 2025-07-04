import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    domains: [
      "maps.googleapis.com",
      "images.unsplash.com",
      "example.com",
      // 다른 외부 이미지 도메인도 필요시 추가
    ],
  },
  /* config options here */
};

export default nextConfig;
