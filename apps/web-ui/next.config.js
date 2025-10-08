/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@audittoolbox/schemas'],
  reactStrictMode: true,
  webpack: (config) => {
    // Handle WASM for SheetJS if needed
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
  // Allow embedding in iframe
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.openai.com https://*.chatgpt.com",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
