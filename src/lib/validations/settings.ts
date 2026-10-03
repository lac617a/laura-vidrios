import { z } from "zod";

import { nullIfEmpty, optionalImageUrl, optionalText as text } from "@/lib/validations/common";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

// Esquema compartido por el formulario (cliente) y la Server Action (servidor).
// Las listas se editan como texto, una opción por línea.

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), {
    message: "Debe ser un enlace que empiece por https://",
  });

/** Cifra opcional para los contadores de la landing (vacío = no se muestra). */
const optionalCount = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{1,6}$/.test(value), {
    message: "Solo números enteros (o vacío para no mostrarla).",
  });

const centimeters = z
  .number({ error: "Escribe un número." })
  .int("Usa centímetros enteros.")
  .min(1, "Debe ser mayor que 0.")
  .max(1000, "Máximo 1000 cm.");

export const settingsFormSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Escribe el nombre del negocio.")
      .max(80, "Máximo 80 caracteres."),
    logoUrl: optionalImageUrl,
    address: text(200),
    openingHours: text(200),
    instagramUrl: optionalUrl,
    facebookUrl: optionalUrl,
    tiktokUrl: optionalUrl,
    whatsappNumber: z
      .string()
      .trim()
      .refine((value) => normalizeWhatsappNumber(value) !== null, {
        message: "Debe ser un celular colombiano: 10 dígitos que empiezan por 3.",
      }),
    referencePrefix: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{2,6}$/, "Entre 2 y 6 letras o números, sin espacios."),
    shippingInfo: text(1000),
    installationInfo: text(1000),
    coverageAreas: text(2000),
    customMinCm: centimeters,
    customMaxCm: centimeters,
    customFrameOptions: text(2000),
    privacyPolicy: text(20000),
    heroImageUrl: optionalImageUrl,
    statsInstalled: optionalCount,
    statsYears: optionalCount,
  })
  .refine((values) => values.customMinCm < values.customMaxCm, {
    path: ["customMaxCm"],
    message: "Debe ser mayor que la medida mínima.",
  });

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

/** Texto con una opción por línea (o separadas por coma) → lista limpia y sin duplicados. */
export function parseList(value: string): string[] {
  const items = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(items)];
}

/** Valores del formulario → datos para guardar en SiteSettings. */
export function toSettingsData(values: SettingsFormValues) {
  return {
    businessName: values.businessName,
    logoUrl: nullIfEmpty(values.logoUrl),
    address: nullIfEmpty(values.address),
    openingHours: nullIfEmpty(values.openingHours),
    instagramUrl: nullIfEmpty(values.instagramUrl),
    facebookUrl: nullIfEmpty(values.facebookUrl),
    tiktokUrl: nullIfEmpty(values.tiktokUrl),
    whatsappNumber: normalizeWhatsappNumber(values.whatsappNumber)!,
    referencePrefix: values.referencePrefix,
    shippingInfo: nullIfEmpty(values.shippingInfo),
    installationInfo: nullIfEmpty(values.installationInfo),
    coverageAreas: parseList(values.coverageAreas),
    customMinCm: values.customMinCm,
    customMaxCm: values.customMaxCm,
    customFrameOptions: parseList(values.customFrameOptions),
    privacyPolicy: nullIfEmpty(values.privacyPolicy),
    heroImageUrl: nullIfEmpty(values.heroImageUrl),
    statsInstalled: values.statsInstalled === "" ? null : Number(values.statsInstalled),
    statsYears: values.statsYears === "" ? null : Number(values.statsYears),
  };
}
