/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // NOTE: assetPrefix './' was previously used for file:// protocol in Capacitor.
  // Since androidScheme is set to 'http', Capacitor uses http://localhost — 
  // absolute paths like /_next/... resolve correctly from any sub-route.
  // No assetPrefix needed.
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@capacitor/filesystem', '@capacitor/share', '@capacitor/core'],
};

export default nextConfig;
