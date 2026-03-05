/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
     remotePatterns: [
      // ... existing patterns ...
      
      // Add this:
      {
        protocol: 'https',
        hostname: 'fanzluvstorage.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow larger uploads for videos
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;