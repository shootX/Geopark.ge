/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'geopark.anovo.ge',
      },
      {
        protocol: 'https',
        hostname: '*.mapbox.com',
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
