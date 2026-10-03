import { ChevronRightIcon } from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductPurchasePanel } from "@/components/catalog/product-purchase-panel";
import { JsonLd } from "@/components/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { SHAPE_LABELS } from "@/lib/catalog";
import {
  getPrerenderedProductSlugs,
  getPublicProduct,
  getRelatedProducts,
  type CatalogCard,
  type PublicProduct,
} from "@/lib/catalog-public";
import { cloudinaryUrl, IMAGE_PRESETS } from "@/lib/cloudinary";
import { formatMedida, formatSizeRange } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";

type Params = PageProps<"/espejos/[slug]">["params"];

export async function generateStaticParams() {
  const slugs = await getPrerenderedProductSlugs();
  // Con Cache Components debe haber al menos un valor: sin productos, uno que da 404.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "sin-productos" }];
}

function describe(product: PublicProduct) {
  if (product.description) return product.description.slice(0, 160);
  return `${SHAPE_LABELS[product.shape]} · ${formatSizeRange(product.variants, product.shape)} · Ref. ${product.reference}`;
}

export async function generateMetadata(
  { params }: { params: Params },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const [product, { businessName }] = await Promise.all([getPublicProduct(slug), getSettings()]);
  if (!product) return { title: "Espejo no encontrado", robots: { index: false } };

  const cover = product.images[0];
  const description = describe(product);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/espejos/${slug}` },
    robots: product.unavailable ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: businessName,
      url: `/espejos/${slug}`,
      // WhatsApp muestra título, descripción y foto al pegar el enlace.
      title: `${product.name} · Ref. ${product.reference}`,
      description,
      // Sin foto se hereda la imagen por defecto del sitio (opengraph-image del layout).
      images: cover
        ? [
            {
              url: cloudinaryUrl(cover.publicId, IMAGE_PRESETS.og),
              width: 1200,
              height: 630,
              alt: cover.alt ?? product.name,
            },
          ]
        : ((await parent).openGraph?.images ?? []),
    },
  };
}

export default function ProductPage({ params }: PageProps<"/espejos/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:pt-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetails({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getPublicProduct(slug), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts({
    id: product.id,
    categoryId: product.category.id,
    shape: product.shape,
  });

  if (product.unavailable) return <UnavailableProduct product={product} related={related} />;

  const siteUrl = getSiteUrl();

  return (
    <>
      <Breadcrumbs product={product} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={product.images} shape={product.shape} name={product.name} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm text-muted-foreground">
            {product.category.name} · Ref. {product.reference}
          </p>
          <h1 className="mt-1 font-heading text-4xl font-semibold text-balance sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-6">
            <ProductPurchasePanel
              product={product}
              context={{
                whatsappNumber: settings.whatsappNumber,
                siteUrl,
                customMinCm: settings.customMinCm,
                customMaxCm: settings.customMaxCm,
                coverageAreas: settings.coverageAreas,
                shippingInfo: settings.shippingInfo,
                installationInfo: settings.installationInfo,
              }}
            />
          </div>
          {product.description && (
            <p className="mt-8 leading-relaxed whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}
          <Specs product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <RelatedProducts title="También te puede gustar" cards={related} slug={product.slug} />
      )}

      <ProductJsonLd product={product} siteUrl={siteUrl} businessName={settings.businessName} />
    </>
  );
}

function Breadcrumbs({ product }: { product: PublicProduct }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/espejos" className="hover:text-foreground">
            Catálogo
          </Link>
        </li>
        <ChevronRightIcon className="size-3.5" aria-hidden />
        <li>
          <Link
            href={`/espejos?categoria=${product.category.slug}`}
            className="hover:text-foreground"
          >
            {product.category.name}
          </Link>
        </li>
        <ChevronRightIcon className="size-3.5" aria-hidden />
        <li aria-current="page" className="truncate text-foreground">
          {product.name}
        </li>
      </ol>
    </nav>
  );
}

function Specs({ product }: { product: PublicProduct }) {
  const rows: Array<[string, string]> = [
    ["Referencia", product.reference],
    ["Forma", SHAPE_LABELS[product.shape]],
    [
      "Medidas",
      product.variants.length > 0
        ? product.variants
            .map((variant) => formatMedida(variant.widthCm, variant.heightCm, product.shape))
            .join(" · ")
        : "A la medida",
    ],
  ];
  if (product.frameMaterial) rows.push(["Marco o material", product.frameMaterial]);
  if (product.frameColor) rows.push(["Color", product.frameColor]);
  if (product.style) rows.push(["Estilo", product.style]);
  rows.push(["Luz LED", product.hasLed ? "Sí" : "No"]);
  if (product.allowCustomSize) rows.push(["A la medida", "Sí, en la medida que necesites"]);

  return (
    // Ids con el slug: Next guarda las fichas visitadas ocultas en el DOM (<Activity>).
    <section aria-labelledby={`specs-${product.slug}`} className="mt-10 border-t pt-6">
      <h2 id={`specs-${product.slug}`} className="text-sm font-semibold">
        Ficha técnica
      </h2>
      <dl className="mt-3 divide-y text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[9rem_1fr] gap-4 py-2.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RelatedProducts({
  title,
  cards,
  slug,
}: {
  title: string;
  cards: CatalogCard[];
  slug: string;
}) {
  return (
    <section aria-labelledby={`related-${slug}`} className="mt-20">
      <h2 id={`related-${slug}`} className="font-heading text-3xl font-semibold">
        {title}
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
        {cards.map((card) => (
          <li key={card.id}>
            <ProductCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Archivado o en categoría oculta: los enlaces viejos en los chats llegan aquí (PRD RF-D07). */
function UnavailableProduct({
  product,
  related,
}: {
  product: PublicProduct;
  related: CatalogCard[];
}) {
  return (
    <>
      <div className="mx-auto max-w-xl py-10 text-center">
        <p className="text-sm text-muted-foreground">Ref. {product.reference}</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold text-balance">
          Este modelo ya no está disponible
        </h1>
        <p className="mt-3 text-muted-foreground">
          «{product.name}» salió del catálogo. Mira estos espejos parecidos o escríbenos: también
          fabricamos a la medida.
        </p>
        <Link
          href="/espejos"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
        >
          Ver el catálogo
        </Link>
      </div>
      {related.length > 0 && (
        <RelatedProducts title="Espejos parecidos" cards={related} slug={product.slug} />
      )}
    </>
  );
}

function ProductJsonLd({
  product,
  siteUrl,
  businessName,
}: {
  product: PublicProduct;
  siteUrl: string;
  businessName: string;
}) {
  const prices = product.showPrice
    ? product.variants
        .map((variant) => variant.price)
        .filter((price): price is number => price !== null)
    : [];
  const inStock = product.variants.some((variant) => variant.availability === "IN_STOCK");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.reference,
    category: product.category.name,
    description: describe(product),
    brand: { "@type": "Brand", name: businessName },
    ...(product.images.length > 0 && {
      image: product.images.map((image) => cloudinaryUrl(image.publicId, { width: 1200 })),
    }),
    url: `${siteUrl}/espejos/${product.slug}`,
    ...(prices.length > 0 && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "COP",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      },
    }),
  };

  return <JsonLd data={jsonLd} />;
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      <Skeleton className="aspect-4/5 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
