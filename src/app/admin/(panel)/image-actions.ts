"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import type { ActionFailure, ActionResult } from "@/lib/action-result";
import { PRODUCTS_TAG } from "@/lib/cache-tags";
import { catalogFailure } from "@/lib/catalog-admin";
import {
  createUploadSignature,
  getCloudinaryConfig,
  isAuthenticUpload,
  uploadFolder,
  type UploadSignature,
} from "@/lib/cloudinary-server";
import { authorizeAction } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import * as images from "@/lib/product-images";

// Subidas directas del navegador a Cloudinary: el servidor firma antes y verifica después.

const NOT_CONFIGURED: ActionFailure = {
  ok: false,
  status: 503,
  error: "Las fotos aún no están configuradas (faltan las credenciales de Cloudinary).",
};

const idSchema = z.string().min(1).max(40);

const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), productId: idSchema }),
  z.object({ kind: z.literal("logo") }),
  z.object({ kind: z.literal("hero") }),
  z.object({ kind: z.literal("category") }),
]);

/** Respuesta de Cloudinary tras subir (solo los campos que se usan). */
const uploadResultSchema = z.object({
  public_id: z.string().min(1).max(300),
  version: z.union([z.number(), z.string()]),
  signature: z.string().min(1).max(80),
  secure_url: z.url().startsWith("https://res.cloudinary.com/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

type CloudinaryUploadResult = z.infer<typeof uploadResultSchema>;

export async function signImageUpload(target: unknown): Promise<ActionResult<UploadSignature>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const config = getCloudinaryConfig();
  if (!config) return NOT_CONFIGURED;

  const parsed = targetSchema.safeParse(target);
  if (!parsed.success) return { ok: false, status: 400, error: "Solicitud inválida." };

  // El logo y la foto principal son configuración del negocio: solo OWNER.
  if (
    (parsed.data.kind === "logo" || parsed.data.kind === "hero") &&
    authorization.user.role !== "OWNER"
  ) {
    return { ok: false, status: 403, error: "No tienes permiso para cambiar esta imagen." };
  }
  if (parsed.data.kind === "product") {
    const exists = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    });
    if (!exists) return { ok: false, status: 404, error: "El producto no existe." };
  }

  return { ok: true, data: createUploadSignature(config, uploadFolder(parsed.data)) };
}

/** Verifica una subida a Cloudinary y devuelve su URL (logo y categorías). */
export async function confirmImageUpload(upload: unknown): Promise<ActionResult<{ url: string }>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const verified = verifyUpload(upload);
  if (!verified.ok) return verified;
  return { ok: true, data: { url: verified.upload.secure_url } };
}

export async function addProductImage(
  productId: unknown,
  upload: unknown,
): Promise<ActionResult<{ image: images.ProductImageRow }>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(productId);
  if (!parsedId.success) return { ok: false, status: 404, error: "El producto no existe." };
  const verified = verifyUpload(upload);
  if (!verified.ok) return verified;

  try {
    const image = await images.addProductImage(parsedId.data, {
      publicId: verified.upload.public_id,
      url: verified.upload.secure_url,
      width: verified.upload.width,
      height: verified.upload.height,
    });
    updateTag(PRODUCTS_TAG);
    return { ok: true, data: { image } };
  } catch (error) {
    return catalogFailure(error);
  }
}

export async function reorderProductImages(
  productId: unknown,
  orderedIds: unknown,
): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(productId);
  const parsedIds = z.array(idSchema).max(images.MAX_IMAGES_PER_PRODUCT).safeParse(orderedIds);
  if (!parsedId.success || !parsedIds.success) {
    return { ok: false, status: 400, error: "Solicitud inválida." };
  }

  try {
    await images.reorderProductImages(parsedId.data, parsedIds.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (error) {
    return catalogFailure(error);
  }
}

export async function updateProductImageAlt(imageId: unknown, alt: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(imageId);
  const parsedAlt = z.string().trim().max(160, "Máximo 160 caracteres.").safeParse(alt);
  if (!parsedId.success) return { ok: false, status: 404, error: "La foto ya no existe." };
  if (!parsedAlt.success) {
    return {
      ok: false,
      status: 400,
      error: parsedAlt.error.issues[0]?.message ?? "Texto inválido.",
    };
  }

  try {
    await images.updateProductImageAlt(parsedId.data, parsedAlt.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (error) {
    return catalogFailure(error);
  }
}

export async function deleteProductImage(imageId: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(imageId);
  if (!parsedId.success) return { ok: false, status: 404, error: "La foto ya no existe." };

  try {
    await images.deleteProductImage(parsedId.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (error) {
    return catalogFailure(error);
  }
}

function verifyUpload(
  upload: unknown,
): { ok: true; upload: CloudinaryUploadResult } | ActionFailure {
  const config = getCloudinaryConfig();
  if (!config) return NOT_CONFIGURED;

  const parsed = uploadResultSchema.safeParse(upload);
  if (!parsed.success || !isAuthenticUpload(config, parsed.data)) {
    return { ok: false, status: 400, error: "No se pudo verificar la foto subida." };
  }
  if (!parsed.data.secure_url.startsWith(`https://res.cloudinary.com/${config.cloudName}/`)) {
    return { ok: false, status: 400, error: "La foto no pertenece a esta cuenta." };
  }
  return { ok: true, upload: parsed.data };
}
