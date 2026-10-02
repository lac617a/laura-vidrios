import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Páginas públicas cacheadas con "use cache" e invalidadas desde el admin (PRD §7).
  cacheComponents: true,
};

export default nextConfig;
