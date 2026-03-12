/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // IMPORTANT: Capacitor requires relative paths for assets to resolve file:// URLs
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@capacitor/filesystem', '@capacitor/share', '@capacitor/core'],
};

export default nextConfig;
