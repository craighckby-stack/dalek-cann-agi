import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  watchOptions: {
    ignored: ['**/node_modules/**', '**/skills/**', '**/.next/**', '**/.darleK-backups/**'],
  },
};

export default nextConfig;
