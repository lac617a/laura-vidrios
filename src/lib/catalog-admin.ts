import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ActionFailure } from "@/lib/action-result";
import { publicIdFromUrl } from "@/lib/cloudinary";
import { destroyImage } from "@/lib/cloudinary-server";
import { formatReference, variantSku } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { normalizeSearchText, slugify } from "@/lib/text";
import type { CategoryFormValues } from "@/lib/validations/category";
import { nullIfEmpty } from "@/lib/validations/common";
import { normalizeVariants, type ProductFormValues } from "@/lib/validations/product";

// Escrituras del catálogo desde el admin. Las Server Actions validan y autorizan;
// aquí solo vive la lógica de datos.

type Tx = Prisma.TransactionClient;

/** Error de negocio con un mensaje apto para mostrar a la dueña. */
export class CatalogError extends Error {}

/** Convierte un error de escritura en un ActionFailure para la UI. */
export function catalogFailure(error: unknown): ActionFailure {
  if (error instanceof CatalogError) return { ok: false, status: 409, error: error.message };
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return {
      ok: false,
      status: 409,
      error: "Ya existe un registro con ese valor. Intenta de nuevo.",
    };
  }
  console.error(error);
  return { ok: false, status: 500, error: "No se pudo guardar. Intenta de nuevo." };
}

// ── Slugs y referencias ─────────────────────────────────────

async function uniqueProductSlug(tx: Tx, base: string, excludeId?: string) {
  const root = base || "espejo";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const taken = await tx.product.findFirst({
      where: { slug, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    if (!taken) return slug;
  }
}

async function uniqueCategorySlug(tx: Tx, base: string, excludeId?: string) {
  const root = base || "categoria";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const taken = await tx.category.findFirst({
      where: { slug, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    if (!taken) return slug;
  }
}

/**
 * Siguiente referencia libre (PREFIJO-0001). El incremento del contador bloquea la fila
 * de SiteSettings hasta el fin de la transacción, así dos altas simultáneas no chocan.
 */
async function nextReference(tx: Tx): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const settings = await tx.siteSettings.upsert({
      where: { id: 1 },
      update: { referenceCounter: { increment: 1 } },
      create: {
        id: 1,
        businessName: DEFAULT_SETTINGS.businessName,
        whatsappNumber: "",
        referenceCounter: 1,
      },
      select: { referenceCounter: true, referencePrefix: true },
    });
    const reference = formatReference(settings.referencePrefix, settings.referenceCounter);
    const taken = await tx.product.findUnique({ where: { reference }, select: { id: true } });
    if (!taken) return reference;
  }
  throw new CatalogError("No se pudo generar una referencia libre.");
}

/** Vista previa de la próxima referencia (sin consumirla). */
export async function previewNextReference(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { referenceCounter: true, referencePrefix: true },
  });
  return formatReference(
    settings?.referencePrefix ?? DEFAULT_SETTINGS.referencePrefix,
    (settings?.referenceCounter ?? 0) + 1,
  );
}

// ── Productos ───────────────────────────────────────────────

const NO_PHOTO_MESSAGE = "Sube al menos una foto antes de publicar.";

function productData(values: ProductFormValues, reference: string) {
  return {
    name: values.name,
    reference,
    description: nullIfEmpty(values.description),
    shape: values.shape,
    frameMaterial: nullIfEmpty(values.frameMaterial),
    frameColor: nullIfEmpty(values.frameColor),
    style: nullIfEmpty(values.style),
    hasLed: values.hasLed,
    isFeatured: values.isFeatured,
    showPrice: values.showPrice,
    allowCustomSize: values.allowCustomSize,
    status: values.status,
    categoryId: values.categoryId,
    searchText: normalizeSearchText(values.name, reference),
  };
}

async function assertCategoryExists(tx: Tx, categoryId: string) {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new CatalogError("La categoría elegida ya no existe.");
}

async function assertReferenceFree(tx: Tx, reference: string, excludeId?: string) {
  const taken = await tx.product.findFirst({
    where: { reference, ...(excludeId && { NOT: { id: excludeId } }) },
    select: { id: true },
  });
  if (taken) throw new CatalogError(`La referencia ${reference} ya está en uso.`);
}

export async function createProduct(values: ProductFormValues) {
  // Las fotos se suben después de crear el producto: nace siempre sin fotos.
  if (values.status === "PUBLISHED") throw new CatalogError(NO_PHOTO_MESSAGE);
  return prisma.$transaction(async (tx) => {
    await assertCategoryExists(tx, values.categoryId);
    let reference = values.reference;
    if (reference) await assertReferenceFree(tx, reference);
    else reference = await nextReference(tx);

    const slug = await uniqueProductSlug(tx, values.slug || slugify(values.name));
    const variants = normalizeVariants(values.shape, values.variants);

    return tx.product.create({
      data: {
        ...productData(values, reference),
        slug,
        variants: {
          create: variants.map((variant, position) => ({
            sku: variantSku(reference, variant.widthCm, variant.heightCm),
            widthCm: variant.widthCm,
            heightCm: variant.heightCm,
            price: variant.price,
            availability: variant.availability,
            isDefault: variant.isDefault,
            position,
          })),
        },
      },
      select: { id: true, reference: true },
    });
  });
}

export async function updateProduct(id: string, values: ProductFormValues) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({
      where: { id },
      select: {
        reference: true,
        status: true,
        variants: { select: { id: true } },
        _count: { select: { images: true } },
      },
    });
    if (!current) throw new CatalogError("El producto no existe.");
    await assertCategoryExists(tx, values.categoryId);

    const reference = values.reference || current.reference;
    if (reference !== current.reference) await assertReferenceFree(tx, reference, id);
    const slug = await uniqueProductSlug(tx, values.slug || slugify(values.name), id);

    // Un producto archivado se mantiene archivado al editarlo; se restaura con su acción.
    const status = current.status === "ARCHIVED" ? "ARCHIVED" : values.status;
    if (status === "PUBLISHED" && current.status !== "PUBLISHED" && current._count.images === 0) {
      throw new CatalogError(NO_PHOTO_MESSAGE);
    }

    await tx.product.update({
      where: { id },
      data: { ...productData(values, reference), status, slug },
    });

    // Sincroniza variantes: borra las quitadas, actualiza las existentes y crea las nuevas.
    const existingIds = new Set(current.variants.map((variant) => variant.id));
    const variants = normalizeVariants(values.shape, values.variants);
    const keptIds = variants
      .map((variant) => variant.variantId)
      .filter((variantId): variantId is string => !!variantId && existingIds.has(variantId));

    await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keptIds } } });
    // SKU temporal para que intercambiar medidas entre filas no choque con el índice único.
    for (const variantId of keptIds) {
      await tx.productVariant.update({
        where: { id: variantId },
        data: { sku: `tmp-${variantId}` },
      });
    }
    for (const [position, variant] of variants.entries()) {
      const data = {
        sku: variantSku(reference, variant.widthCm, variant.heightCm),
        widthCm: variant.widthCm,
        heightCm: variant.heightCm,
        price: variant.price,
        availability: variant.availability,
        isDefault: variant.isDefault,
        position,
      };
      if (variant.variantId && existingIds.has(variant.variantId)) {
        await tx.productVariant.update({ where: { id: variant.variantId }, data });
      } else {
        await tx.productVariant.create({ data: { ...data, productId: id } });
      }
    }

    return { id, reference, slug };
  });
}

export async function setProductStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { _count: { select: { variants: true, images: true } } },
  });
  if (!product) throw new CatalogError("El producto no existe.");
  if (status === "PUBLISHED" && product._count.variants === 0) {
    throw new CatalogError("Agrega al menos una medida antes de publicar.");
  }
  if (status === "PUBLISHED" && product._count.images === 0) {
    throw new CatalogError(NO_PHOTO_MESSAGE);
  }
  await prisma.product.update({
    where: { id },
    data: { status, ...(status === "ARCHIVED" && { isFeatured: false }) },
  });
}

export async function setProductFeatured(id: string, isFeatured: boolean) {
  await prisma.product.update({ where: { id }, data: { isFeatured } });
}

/** Copia como borrador con nueva referencia. Las fotos se copian compartiendo los archivos. */
export async function duplicateProduct(id: string) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { position: "asc" } },
        images: { orderBy: { position: "asc" } },
      },
    });
    if (!source) throw new CatalogError("El producto no existe.");

    const reference = await nextReference(tx);
    const name = `${source.name} (copia)`;
    const slug = await uniqueProductSlug(tx, slugify(name));

    return tx.product.create({
      data: {
        reference,
        name,
        slug,
        description: source.description,
        shape: source.shape,
        frameMaterial: source.frameMaterial,
        frameColor: source.frameColor,
        style: source.style,
        hasLed: source.hasLed,
        isFeatured: false,
        showPrice: source.showPrice,
        allowCustomSize: source.allowCustomSize,
        status: "DRAFT",
        categoryId: source.categoryId,
        searchText: normalizeSearchText(name, reference),
        variants: {
          create: source.variants.map((variant) => ({
            sku: variantSku(reference, variant.widthCm, variant.heightCm),
            widthCm: variant.widthCm,
            heightCm: variant.heightCm,
            price: variant.price,
            availability: variant.availability,
            isDefault: variant.isDefault,
            position: variant.position,
          })),
        },
        images: {
          create: source.images.map((image) => ({
            publicId: image.publicId,
            url: image.url,
            alt: image.alt,
            width: image.width,
            height: image.height,
            position: image.position,
          })),
        },
      },
      select: { id: true, reference: true },
    });
  });
}

// ── Categorías ──────────────────────────────────────────────

/** Borra de Cloudinary una imagen guardada por URL (logo o categoría reemplazados). */
export async function destroyImageAtUrl(url: string) {
  const publicId = publicIdFromUrl(url);
  if (publicId) await destroyImage(publicId);
}

export async function createCategory(values: CategoryFormValues) {
  return prisma.$transaction(async (tx) => {
    const slug = await uniqueCategorySlug(tx, values.slug || slugify(values.name));
    const last = await tx.category.aggregate({ _max: { position: true } });
    return tx.category.create({
      data: {
        name: values.name,
        slug,
        description: nullIfEmpty(values.description),
        imageUrl: nullIfEmpty(values.imageUrl),
        isActive: values.isActive,
        position: (last._max.position ?? -1) + 1,
      },
      select: { id: true },
    });
  });
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const previous = await prisma.$transaction(async (tx) => {
    const exists = await tx.category.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!exists) throw new CatalogError("La categoría no existe.");
    const slug = await uniqueCategorySlug(tx, values.slug || slugify(values.name), id);
    await tx.category.update({
      where: { id },
      data: {
        name: values.name,
        slug,
        description: nullIfEmpty(values.description),
        imageUrl: nullIfEmpty(values.imageUrl),
        isActive: values.isActive,
      },
    });
    return exists.imageUrl;
  });
  if (previous && previous !== values.imageUrl) await destroyImageAtUrl(previous);
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { imageUrl: true, _count: { select: { products: true } } },
  });
  if (!category) throw new CatalogError("La categoría no existe.");
  if (category._count.products > 0) {
    throw new CatalogError(
      `Tiene ${category._count.products} producto(s). Muévelos a otra categoría antes de eliminarla.`,
    );
  }
  await prisma.category.delete({ where: { id } });
  if (category.imageUrl) await destroyImageAtUrl(category.imageUrl);
}

/** Sube o baja una categoría una posición (y deja las posiciones consecutivas). */
export async function moveCategory(id: string, direction: "up" | "down") {
  await prisma.$transaction(async (tx) => {
    const ordered = await tx.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true },
    });
    const index = ordered.findIndex((category) => category.id === id);
    if (index === -1) throw new CatalogError("La categoría no existe.");
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return;

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    for (const [position, category] of ordered.entries()) {
      await tx.category.update({ where: { id: category.id }, data: { position } });
    }
  });
}
