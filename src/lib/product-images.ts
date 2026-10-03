import "server-only";

import { CatalogError } from "@/lib/catalog-admin";
import { destroyImage } from "@/lib/cloudinary-server";
import { prisma } from "@/lib/prisma";

// Fotos de producto. La primera (position 0) es la portada.

export const MAX_IMAGES_PER_PRODUCT = 12;

export const productImageSelect = {
  id: true,
  publicId: true,
  url: true,
  alt: true,
  width: true,
  height: true,
  position: true,
} as const;

export type ProductImageRow = {
  id: string;
  publicId: string;
  url: string;
  alt: string | null;
  width: number;
  height: number;
  position: number;
};

export async function listProductImages(productId: string): Promise<ProductImageRow[]> {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: productImageSelect,
  });
}

export async function addProductImage(
  productId: string,
  upload: { publicId: string; url: string; width: number; height: number },
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { name: true, _count: { select: { images: true } } },
    });
    if (!product) throw new CatalogError("El producto no existe.");
    if (product._count.images >= MAX_IMAGES_PER_PRODUCT) {
      throw new CatalogError(`Máximo ${MAX_IMAGES_PER_PRODUCT} fotos por producto.`);
    }
    const last = await tx.productImage.aggregate({
      where: { productId },
      _max: { position: true },
    });
    return tx.productImage.create({
      data: {
        productId,
        ...upload,
        alt: product.name,
        position: (last._max.position ?? -1) + 1,
      },
      select: productImageSelect,
    });
  });
}

/** Guarda el nuevo orden. `orderedIds` debe tener exactamente las fotos del producto. */
export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.productImage.findMany({
      where: { productId },
      select: { id: true },
    });
    const currentIds = new Set(current.map((image) => image.id));
    const sameSet =
      orderedIds.length === currentIds.size && orderedIds.every((id) => currentIds.has(id));
    if (!sameSet) throw new CatalogError("Las fotos cambiaron. Recarga la página.");

    for (const [position, id] of orderedIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { position } });
    }
  });
}

export async function updateProductImageAlt(imageId: string, alt: string) {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true },
  });
  if (!image) throw new CatalogError("La foto ya no existe.");
  await prisma.productImage.update({ where: { id: imageId }, data: { alt: alt || null } });
}

/**
 * Borra la foto. El archivo en Cloudinary solo se elimina si ninguna otra foto lo usa
 * (las copias de un producto duplicado comparten archivos).
 */
export async function deleteProductImage(imageId: string) {
  const deleted = await prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        publicId: true,
        productId: true,
        product: { select: { status: true, _count: { select: { images: true } } } },
      },
    });
    if (!image) throw new CatalogError("La foto ya no existe.");
    if (image.product.status === "PUBLISHED" && image.product._count.images === 1) {
      throw new CatalogError(
        "Es la única foto de un producto publicado. Sube otra primero o pásalo a borrador.",
      );
    }

    await tx.productImage.delete({ where: { id: imageId } });
    const remaining = await tx.productImage.findMany({
      where: { productId: image.productId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    for (const [position, { id }] of remaining.entries()) {
      await tx.productImage.update({ where: { id }, data: { position } });
    }
    const stillUsed = await tx.productImage.count({ where: { publicId: image.publicId } });
    return { publicId: image.publicId, stillUsed: stillUsed > 0 };
  });

  if (!deleted.stillUsed) await destroyImage(deleted.publicId);
}
