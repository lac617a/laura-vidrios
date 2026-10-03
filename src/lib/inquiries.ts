import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { MirrorShape } from "@/generated/prisma/enums";
import { SHAPE_LABELS } from "@/lib/catalog";
import { CUSTOM_REFERENCE } from "@/lib/custom-order";
import { hasEqualSides } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import type {
  CatalogInquiryPayload,
  CustomInquiryPayload,
  InquiryPayload,
} from "@/lib/validations/inquiry";

// Registro de consultas que llegan desde el botón de WhatsApp (POST /api/inquiries).

/** Consulta que no se puede registrar; `status` es la respuesta HTTP. */
export class InquiryError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

type InquiryData = Omit<Prisma.InquiryCreateInput, "code">;

export async function recordInquiry(payload: InquiryPayload): Promise<{ code: string }> {
  const data: InquiryData =
    payload.type === "CATALOG"
      ? await catalogInquiryData(payload)
      : payload.type === "CUSTOM"
        ? await customInquiryData(payload)
        : { type: "GENERAL", source: payload.source || null };
  return createWithCode(payload.code, data);
}

/** Medidas dentro de los límites de «A la medida» de la configuración (y lados iguales si aplica). */
async function assertCustomSize(shape: MirrorShape, widthCm: number, heightCm: number) {
  const { customMinCm, customMaxCm } = await getSettings();
  const inRange = (value: number) => value >= customMinCm && value <= customMaxCm;
  if (!inRange(widthCm) || !inRange(heightCm)) {
    throw new InquiryError(400, "La medida está fuera del rango permitido.");
  }
  if (hasEqualSides(shape) && widthCm !== heightCm) {
    throw new InquiryError(400, "En esta forma el ancho y el alto son iguales.");
  }
}

/** Formulario «A la medida»: no hay producto; el ítem guarda todo lo que pidió el cliente. */
async function customInquiryData(payload: CustomInquiryPayload): Promise<InquiryData> {
  await assertCustomSize(payload.shape, payload.widthCm, payload.heightCm);
  return {
    type: "CUSTOM",
    needsShipping: payload.needsShipping,
    needsInstallation: payload.needsInstallation,
    city: payload.city || null,
    source: payload.source || null,
    items: {
      create: [
        {
          reference: CUSTOM_REFERENCE,
          productName: `Espejo a la medida · ${SHAPE_LABELS[payload.shape]}`,
          widthCm: payload.widthCm,
          heightCm: payload.heightCm,
          isCustomSize: true,
          customShape: payload.shape,
          frameDetails: payload.frame,
          hasLed: payload.hasLed,
          quantity: payload.quantity,
          notes: payload.notes || null,
        },
      ],
    },
  };
}

/** Snapshot del producto y la medida tal como estaban al consultar (nombre, referencia, precio). */
async function catalogInquiryData(payload: CatalogInquiryPayload): Promise<InquiryData> {
  const product = await prisma.product.findFirst({
    where: { id: payload.productId, status: "PUBLISHED", category: { isActive: true } },
    select: {
      id: true,
      name: true,
      reference: true,
      shape: true,
      allowCustomSize: true,
      variants: {
        where: { sku: payload.sku ?? "" },
        select: { id: true, sku: true, widthCm: true, heightCm: true, price: true },
      },
    },
  });
  if (!product) throw new InquiryError(404, "El producto no está disponible.");

  let item: Prisma.InquiryItemCreateWithoutInquiryInput;
  if (payload.customSize) {
    const { widthCm, heightCm } = payload.customSize;
    if (!product.allowCustomSize) {
      throw new InquiryError(400, "Este producto no se hace a la medida.");
    }
    await assertCustomSize(product.shape, widthCm, heightCm);
    item = {
      product: { connect: { id: product.id } },
      reference: product.reference,
      productName: product.name,
      widthCm,
      heightCm,
      isCustomSize: true,
    };
  } else {
    const variant = product.variants[0];
    if (!variant) throw new InquiryError(404, "La medida ya no está disponible.");
    item = {
      product: { connect: { id: product.id } },
      variant: { connect: { id: variant.id } },
      reference: variant.sku,
      productName: product.name,
      widthCm: variant.widthCm,
      heightCm: variant.heightCm,
      priceSnapshot: variant.price,
    };
  }

  return {
    type: "CATALOG",
    needsShipping: payload.needsShipping,
    needsInstallation: payload.needsInstallation,
    city: payload.city || null,
    source: payload.source || null,
    items: { create: [item] },
  };
}

/**
 * El código se genera en el navegador y ya viaja en el mensaje. Si choca con uno existente
 * (poco probable: 31⁶ combinaciones), se guarda con sufijo y la búsqueda por prefijo lo encuentra.
 */
async function createWithCode(code: string, data: InquiryData): Promise<{ code: string }> {
  for (const candidate of [code, `${code}-2`, `${code}-3`]) {
    try {
      await prisma.inquiry.create({ data: { ...data, code: candidate }, select: { id: true } });
      return { code: candidate };
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  throw new InquiryError(409, "Código de consulta repetido.");
}
