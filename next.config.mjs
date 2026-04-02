/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/api/push/vapid-public',
        destination: '/api/vapid-public',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
