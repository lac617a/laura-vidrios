import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { Availability, MirrorShape } from "@/generated/prisma/enums";
import { CATEGORIES_TAG, PRODUCTS_TAG } from "@/lib/cache-tags";
import { SHAPE_LABELS } from "@/lib/catalog";
import { SHAPE_SLUGS, type CatalogFilters, type ShapeSlug } from "@/lib/catalog-filters";
import { formatPriceFrom, formatSizeRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { normalizeSearchText } from "@/lib/text";

// Lecturas del catálogo público: cacheadas con "use cache" y etiquetadas para que
// updateTag(PRODUCTS_TAG / CATEGORIES_TAG) desde el admin las invalide al instante.

export const CATALOG_PAGE_SIZE = 24;
const MAX_PAGES = 20;

const PUBLISHED: Prisma.ProductWhereInput = {
  status: "PUBLISHED",
  category: { isActive: true },
};

function buildWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const tokens = normalizeSearchText(filters.q).split(" ").filter(Boolean);
  const shapes = filters.forma.map((slug: ShapeSlug) => SHAPE_SLUGS[slug]);
  const hasPriceFilter = filters.precioMin !== null || filters.precioMax !== null;

  // Una misma medida debe cumplir todos los filtros de tamaño, precio y disponibilidad.
  const variant: Prisma.ProductVariantWhereInput = {};
  if (filters.anchoMin !== null || filters.anchoMax !== null) {
    variant.widthCm = { gte: filters.anchoMin ?? undefined, lte: filters.anchoMax ?? undefined };
  }
  if (filters.altoMin !== null || filters.altoMax !== null) {
    variant.heightCm = { gte: filters.altoMin ?? undefined, lte: filters.altoMax ?? undefined };
  }
  if (hasPriceFilter) {
    variant.price = { gte: filters.precioMin ?? undefined, lte: filters.precioMax ?? undefined };
  }
  if (filters.disponible) variant.availability = "IN_STOCK";

  return {
    ...PUBLISHED,
    category: { isActive: true, ...(filters.categoria && { slug: filters.categoria }) },
    ...(tokens.length > 0 && { AND: tokens.map((token) => ({ searchText: { contains: token } })) }),
    ...(shapes.length > 0 && { shape: { in: shapes } }),
    ...(filters.marco.length > 0 && { frameMaterial: { in: filters.marco } }),
    ...(filters.led && { hasLed: true }),
    ...(hasPriceFilter && { showPrice: true }),
    ...(Object.keys(variant).length > 0 && { variants: { some: variant } }),
  };
}

export type CatalogCard = {
  id: string;
  slug: string;
  name: string;
  reference: string;
  shape: MirrorShape;
  hasLed: boolean;
  categoryName: string;
  sizeLabel: string;
  priceLabel: string;
  /** Solo "Bajo pedido" si ninguna medida está disponible ya. */
  madeToOrder: boolean;
  images: Array<{ publicId: string; alt: string | null }>;
};

function toCard(product: {
  id: string;
  slug: string;
  name: string;
  reference: string;
  shape: MirrorShape;
  hasLed: boolean;
  showPrice: boolean;
  category: { name: string };
  images: Array<{ publicId: string; alt: string | null }>;
  variants: Array<{
    widthCm: number;
    heightCm: number;
    price: number | null;
    availability: Availability;
  }>;
}): CatalogCard {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    reference: product.reference,
    shape: product.shape,
    hasLed: product.hasLed,
    categoryName: product.category.name,
    sizeLabel: formatSizeRange(product.variants, product.shape),
    priceLabel: formatPriceFrom(
      product.variants.map((variant) => variant.price),
      product.showPrice,
    ),
    madeToOrder:
      product.variants.length > 0 &&
      product.variants.every((variant) => variant.availability !== "IN_STOCK"),
    images: product.images,
  };
}

/** Página del catálogo: los primeros `pagina × 24` resultados ("Cargar más" sube la página). */
export async function getCatalogPage(filters: CatalogFilters) {
  "use cache";
  cacheTag(PRODUCTS_TAG, CATEGORIES_TAG);
  cacheLife("max");

  const where = buildWhere(filters);
  const take = Math.min(Math.max(filters.pagina, 1), MAX_PAGES) * CATALOG_PAGE_SIZE;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take,
      select: {
        id: true,
        slug: true,
        name: true,
        reference: true,
        shape: true,
        hasLed: true,
        showPrice: true,
        category: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 2, select: { publicId: true, alt: true } },
        variants: {
          orderBy: { position: "asc" },
          select: { widthCm: true, heightCm: true, price: true, availability: true },
        },
      },
    }),
  ]);

  return { total, cards: products.map(toCard), hasMore: total > products.length };
}

export type CatalogFacets = Awaited<ReturnType<typeof getCatalogFacets>>;

/** Opciones de los filtros: solo valores que existen en productos publicados. */
export async function getCatalogFacets() {
  "use cache";
  cacheTag(PRODUCTS_TAG, CATEGORIES_TAG);
  cacheLife("max");

  const [categories, shapes, frames, ledCount] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, products: { some: { status: "PUBLISHED" } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
      },
    }),
    prisma.product.groupBy({ by: ["shape"], where: PUBLISHED, _count: { _all: true } }),
    prisma.product.groupBy({
      by: ["frameMaterial"],
      where: { ...PUBLISHED, frameMaterial: { not: null } },
      _count: { _all: true },
    }),
    prisma.product.count({ where: { ...PUBLISHED, hasLed: true } }),
  ]);

  const shapeOrder = Object.values(SHAPE_SLUGS) as MirrorShape[];
  return {
    categories: categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      count: category._count.products,
    })),
    shapes: shapes
      .sort((a, b) => shapeOrder.indexOf(a.shape) - shapeOrder.indexOf(b.shape))
      .map((row) => ({ shape: row.shape, label: SHAPE_LABELS[row.shape], count: row._count._all })),
    frames: frames
      .filter((row): row is typeof row & { frameMaterial: string } => row.frameMaterial !== null)
      .sort((a, b) => b._count._all - a._count._all)
      .map((row) => ({ value: row.frameMaterial, count: row._count._all })),
    hasLed: ledCount > 0,
  };
}

// ── Detalle de producto ─────────────────────────────────────

export type PublicVariant = {
  sku: string;
  widthCm: number;
  heightCm: number;
  price: number | null;
  availability: Availability;
  isDefault: boolean;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  reference: string;
  description: string | null;
  shape: MirrorShape;
  frameMaterial: string | null;
  frameColor: string | null;
  style: string | null;
  hasLed: boolean;
  showPrice: boolean;
  allowCustomSize: boolean;
  /** Archivado o en una categoría oculta: se muestra "ya no disponible". */
  unavailable: boolean;
  category: { id: string; name: string; slug: string };
  images: Array<{ publicId: string; alt: string | null; width: number; height: number }>;
  variants: PublicVariant[];
};

/** Producto por slug para la ficha pública. null si no existe o es un borrador. */
export async function getPublicProduct(slug: string): Promise<PublicProduct | null> {
  "use cache";
  cacheTag(PRODUCTS_TAG, CATEGORIES_TAG);
  cacheLife("max");

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      reference: true,
      description: true,
      shape: true,
      frameMaterial: true,
      frameColor: true,
      style: true,
      hasLed: true,
      showPrice: true,
      allowCustomSize: true,
      status: true,
      category: { select: { id: true, name: true, slug: true, isActive: true } },
      images: {
        orderBy: { position: "asc" },
        select: { publicId: true, alt: true, width: true, height: true },
      },
      variants: {
        orderBy: { position: "asc" },
        select: {
          sku: true,
          widthCm: true,
          heightCm: true,
          price: true,
          availability: true,
          isDefault: true,
        },
      },
    },
  });
  if (!product || product.status === "DRAFT") return null;

  const { status, category, ...rest } = product;
  return {
    ...rest,
    unavailable: status === "ARCHIVED" || !category.isActive,
    category: { id: category.id, name: category.name, slug: category.slug },
  };
}

/** Hasta 4 productos parecidos: misma categoría primero, luego misma forma. */
export async function getRelatedProducts(product: {
  id: string;
  categoryId: string;
  shape: MirrorShape;
}): Promise<CatalogCard[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG, CATEGORIES_TAG);
  cacheLife("max");

  const products = await prisma.product.findMany({
    where: {
      ...PUBLISHED,
      id: { not: product.id },
      OR: [{ categoryId: product.categoryId }, { shape: product.shape }],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      slug: true,
      name: true,
      reference: true,
      shape: true,
      hasLed: true,
      showPrice: true,
      categoryId: true,
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 2, select: { publicId: true, alt: true } },
      variants: {
        orderBy: { position: "asc" },
        select: { widthCm: true, heightCm: true, price: true, availability: true },
      },
    },
  });

  return products
    .sort(
      (a, b) =>
        Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId),
    )
    .slice(0, 4)
    .map(toCard);
}

/** Slugs que se prerenderizan en el build (los demás se generan en la primera visita). */
export async function getPrerenderedProductSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("max");

  const products = await prisma.product.findMany({
    where: PUBLISHED,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: { slug: true },
  });
  return products.map((product) => product.slug);
}
