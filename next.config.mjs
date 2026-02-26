/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@capacitor/filesystem', '@capacitor/share', '@capacitor/core'],
};

export default nextConfig;
