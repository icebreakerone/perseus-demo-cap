const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  output: 'standalone',
  webpack: (config, { dev }) => {
    // enable polling for file changes (Docker issue)
    if (dev)
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    return config
  },
}

module.exports = nextConfig
