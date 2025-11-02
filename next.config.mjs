/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  // Security headers handled by proxy.js
};

export default nextConfig;
