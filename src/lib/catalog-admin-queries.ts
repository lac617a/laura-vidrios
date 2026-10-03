import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { previewNextReference } from "@/lib/catalog-admin";
import { prisma } from "@/lib/prisma";
import { getSettingsFresh } from "@/lib/settings";
import { normalizeSearchText } from "@/lib/text";
import type { ProductFormValues } from "@/lib/validations/product";

// Lecturas del catálogo para el admin (sin caché: siempre datos frescos).

export const ADMIN_PAGE_SIZE = 20;

export const productListParamsSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  categoria: z.string().max(40).catch(""),
  estado: z.enum(["activos", "PUBLISHED", "DRAFT", "ARCHIVED"]).catch("activos"),
  pagina: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type ProductListParams = z.infer<typeof productListParamsSchema>;

export async function listAdminProducts(params: ProductListParams) {
  const search = normalizeSearchText(params.q);
  const base: Prisma.ProductWhereInput = {
    ...(search && { searchText: { contains: search } }),
    ...(params.categoria && { categoryId: params.categoria }),
  };
  const where: Prisma.ProductWhereInput = {
    ...base,
    status: params.estado === "activos" ? { not: "ARCHIVED" } : params.estado,
  };

  const [total, products, statusCounts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (params.pagina - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        name: true,
        status: true,
        isFeatured: true,
        showPrice: true,
        shape: true,
        category: { select: { name: true } },
        variants: {
          orderBy: { position: "asc" },
          select: { widthCm: true, heightCm: true, price: true },
        },
        images: { orderBy: { position: "asc" }, take: 1, select: { publicId: true } },
      },
    }),
    prisma.product.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);

  const counts = { PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 };
  for (const row of statusCounts) counts[row.status] = row._count._all;

  return {
    products,
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    counts: { ...counts, activos: counts.PUBLISHED + counts.DRAFT },
  };
}

export type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>["products"][number];

export async function listCategoryOptions() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true },
  });
}

export async function listCategoriesWithCounts() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

export type AdminCategoryRow = Awaited<ReturnType<typeof listCategoriesWithCounts>>[number];

/** Opciones del formulario de producto: categorías, sugerencias de marco y próxima referencia. */
export async function getProductFormOptions() {
  const [categories, settings, frameValues, nextReference] = await Promise.all([
    listCategoryOptions(),
    getSettingsFresh(),
    prisma.product.findMany({
      where: { frameMaterial: { not: null } },
      distinct: ["frameMaterial"],
      select: { frameMaterial: true },
      take: 50,
    }),
    previewNextReference(),
  ]);

  const frameSuggestions = [
    ...new Set([
      ...settings.customFrameOptions,
      ...frameValues.map((row) => row.frameMaterial).filter((value): value is string => !!value),
    ]),
  ];

  return { categories, frameSuggestions, nextReference };
}

/** Producto en el formato del formulario, o null si no existe. */
export async function getProductForEdit(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { position: "asc" } },
      images: { orderBy: { position: "asc" }, select: { id: true, publicId: true, alt: true } },
    },
  });
  if (!product) return null;

  const values: ProductFormValues = {
    name: product.name,
    slug: product.slug,
    reference: product.reference,
    categoryId: product.categoryId,
    shape: product.shape,
    description: product.description ?? "",
    frameMaterial: product.frameMaterial ?? "",
    frameColor: product.frameColor ?? "",
    style: product.style ?? "",
    hasLed: product.hasLed,
    isFeatured: product.isFeatured,
    showPrice: product.showPrice,
    allowCustomSize: product.allowCustomSize,
    status: product.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    variants: product.variants.map((variant) => ({
      variantId: variant.id,
      widthCm: variant.widthCm,
      heightCm: variant.heightCm,
      price: variant.price,
      availability: variant.availability,
      isDefault: variant.isDefault,
    })),
  };

  return {
    id: product.id,
    status: product.status,
    slug: product.slug,
    reference: product.reference,
    updatedAt: product.updatedAt,
    images: product.images,
    values,
  };
}
