/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  transpilePackages: ['three'],
  async rewrites() {
    return [
      {
        source: '/games',
        destination: '/games',
      },
    ]
  },
}

export default nextConfig