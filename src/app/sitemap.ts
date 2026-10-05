import type { MetadataRoute } from "next";

import { getSitemapProducts } from "@/lib/catalog-public";
import { cloudinaryUrl, IMAGE_PRESETS } from "@/lib/cloudinary";
import { getSiteUrl } from "@/lib/site-url";

// Se prerenderiza en el build y se regenera cuando el admin cambia productos o categorías
// (getSitemapProducts está cacheado con esos tags). Solo productos publicados: los
// archivados siguen respondiendo, pero con noindex.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const products = await getSitemapProducts();
  const catalogUpdatedAt = products.reduce<Date | undefined>(
    (latest, product) => (!latest || product.updatedAt > latest ? product.updatedAt : latest),
    undefined,
  );

  return [
    { url: site, lastModified: catalogUpdatedAt, priority: 1 },
    { url: `${site}/espejos`, lastModified: catalogUpdatedAt, priority: 0.9 },
    { url: `${site}/a-la-medida`, priority: 0.8 },
    ...products.map((product) => ({
      url: `${site}/espejos/${product.slug}`,
      lastModified: product.updatedAt,
      priority: 0.7,
      images: product.images.map((image) =>
        cloudinaryUrl(image.publicId, { ...IMAGE_PRESETS.detail, width: 1600 }),
      ),
    })),
    { url: `${site}/politica-de-datos`, priority: 0.2 },
  ];
}
