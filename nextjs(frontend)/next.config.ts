import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["http://192.168.1.24:3000", "http://192.168.1.24:3001", "http://localhost:3001"],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.1.24',
        port: '3000',
        pathname: '/api/media/file/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.24',
        port: '9000',
        pathname: '/static/**',
      },
    ],
  },
};

export default nextConfig;
