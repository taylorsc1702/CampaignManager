/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://admin.shopify.com'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig