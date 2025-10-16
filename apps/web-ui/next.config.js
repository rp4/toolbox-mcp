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
  // Allow embedding in iframe from ChatGPT/OpenAI
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Remove X-Frame-Options to allow CSP frame-ancestors to take precedence
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.openai.com https://*.chatgpt.com https://chatgpt.com https://chat.openai.com",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
