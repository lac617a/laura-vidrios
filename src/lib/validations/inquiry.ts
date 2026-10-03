import { z } from "zod";

import { MirrorShape } from "@/generated/prisma/enums";
import { CUSTOM_NOTES_MAX, CUSTOM_QUANTITY_MAX } from "@/lib/custom-order";
import { isInquiryCode } from "@/lib/inquiry-code";
import { INQUIRY_CITY_MAX } from "@/lib/whatsapp";

// Registro de consultas (POST /api/inquiries, enviado con sendBeacon). El navegador solo manda
// lo que eligió el cliente; nombre, referencia y precio los toma el servidor de la BD (snapshot).

const SOURCE_MAX = 200;

const code = z.string().refine(isInquiryCode, "Código de consulta inválido.");

/** Texto corto de una línea, sin caracteres de control. */
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/\p{Cc}/u.test(value), "Texto inválido.");

/** Canal y campaña: "detalle", "flotante /espejos", "detalle utm_source=instagram"… */
const source = singleLine(SOURCE_MAX).optional();

const centimeters = z.number().int().min(1).max(1000);

const catalogInquiry = z
  .object({
    type: z.literal("CATALOG"),
    code,
    productId: z.string().min(1).max(40),
    /** Medida del catálogo elegida (SKU de la variante)… */
    sku: z.string().min(1).max(80).nullable(),
    /** …o una medida personalizada. */
    customSize: z.object({ widthCm: centimeters, heightCm: centimeters }).nullable(),
    needsShipping: z.boolean(),
    needsInstallation: z.boolean(),
    city: singleLine(INQUIRY_CITY_MAX),
    source,
  })
  .refine((value) => (value.sku === null) !== (value.customSize === null), {
    message: "Indica una medida del catálogo o una medida personalizada.",
  });

/** Formulario «A la medida»: los límites de medida se validan en el servidor con la configuración. */
const customInquiry = z.object({
  type: z.literal("CUSTOM"),
  code,
  shape: z.enum(MirrorShape),
  widthCm: centimeters,
  heightCm: centimeters,
  frame: singleLine(80).min(1),
  hasLed: z.boolean(),
  quantity: z.number().int().min(1).max(CUSTOM_QUANTITY_MAX),
  /** Varias líneas: solo se permite el salto de línea como carácter de control. */
  notes: z
    .string()
    .trim()
    .max(CUSTOM_NOTES_MAX)
    .refine((value) => !/[^\P{Cc}\n]/u.test(value), "Texto inválido."),
  needsShipping: z.boolean(),
  needsInstallation: z.boolean(),
  city: singleLine(INQUIRY_CITY_MAX),
  source,
});

const generalInquiry = z.object({
  type: z.literal("GENERAL"),
  code,
  source,
});

export const inquiryPayloadSchema = z.discriminatedUnion("type", [
  catalogInquiry,
  customInquiry,
  generalInquiry,
]);

export type InquiryPayload = z.infer<typeof inquiryPayloadSchema>;
export type CatalogInquiryPayload = Extract<InquiryPayload, { type: "CATALOG" }>;
export type CustomInquiryPayload = Extract<InquiryPayload, { type: "CUSTOM" }>;
