import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Product images come from Open Food Facts. Restricting the hosts here means an
  // untrusted image URL in the API response cannot be loaded through next/image.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
      },
    ],
  },
};

export default nextConfig;
