/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      { source: "/health", destination: "/api/health" },
      { source: "/send-gst", destination: "/api/send-gst" },
    ];
  },
};

module.exports = nextConfig;
