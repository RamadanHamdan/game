import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // Fix: Turbopack salah deteksi root karena ada package-lock.json di parent folder.
  // Paksa root ke direktori project ini.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
