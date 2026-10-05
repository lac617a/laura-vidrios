import type { NextConfig } from "next";

import { canonicalHostRedirects } from "./src/lib/canonical-host";

// Cabeceras de seguridad para todas las respuestas. Sin CSP de scripts: exigiría un nonce por
// request y las páginas públicas dejarían de ser estáticas (cacheComponents).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Páginas públicas cacheadas con "use cache" e invalidadas desde el admin (PRD §7).
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // 308 al dominio propio cuando exista CANONICAL_HOST (solo producción).
  async redirects() {
    return canonicalHostRedirects({
      CANONICAL_HOST: process.env.CANONICAL_HOST,
      VERCEL_ENV: process.env.VERCEL_ENV,
    });
  },
};

export default nextConfig;
