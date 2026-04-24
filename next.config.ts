import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/brand/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://theflyingbus.com',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

export default nextConfig
