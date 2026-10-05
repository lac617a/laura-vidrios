import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

// Los previews de Vercel no se indexan: comparten contenido con producción y cambian de URL.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
