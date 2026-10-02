import { z } from "zod";

import { Availability, MirrorShape } from "@/generated/prisma/enums";
import { formatMedida, hasEqualSides } from "@/lib/format";
import { optionalSlug, optionalText } from "@/lib/validations/common";

// Esquema compartido por el formulario de producto (cliente) y las Server Actions (servidor).

const centimeters = z
  .number({ error: "Escribe la medida." })
  .int("Usa centímetros enteros.")
  .min(1, "Debe ser mayor que 0.")
  .max(1000, "Máximo 1000 cm.");

export const variantFormSchema = z.object({
  /** id de la variante existente (vacío en las nuevas). No se llama `id` por useFieldArray. */
  variantId: z.string().optional(),
  widthCm: centimeters,
  heightCm: centimeters,
  /** COP enteros; null = sin precio ("A consultar"). */
  price: z
    .number()
    .int()
    .min(0, "El precio no puede ser negativo.")
    .max(999_999_999, "Precio demasiado alto.")
    .nullable(),
  availability: z.enum(Availability),
  isDefault: z.boolean(),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe el nombre.").max(120, "Máximo 120 caracteres."),
    slug: optionalSlug,
    /** Vacío al crear: se asigna la siguiente referencia (PREFIJO-0001). */
    reference: z
      .string()
      .trim()
      .toUpperCase()
      .max(30, "Máximo 30 caracteres.")
      .refine((value) => value === "" || /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value), {
        message: "Solo letras, números y guiones (ej. ESP-0012).",
      }),
    categoryId: z.string().min(1, "Elige una categoría."),
    shape: z.enum(MirrorShape),
    description: optionalText(2000),
    frameMaterial: optionalText(60),
    frameColor: optionalText(60),
    style: optionalText(60),
    hasLed: z.boolean(),
    isFeatured: z.boolean(),
    showPrice: z.boolean(),
    allowCustomSize: z.boolean(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    variants: z.array(variantFormSchema).max(30, "Máximo 30 medidas por producto."),
  })
  .superRefine((product, ctx) => {
    if (product.status === "PUBLISHED" && product.variants.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Agrega al menos una medida para publicar.",
      });
    }

    const seen = new Set<string>();
    product.variants.forEach((variant, index) => {
      const { widthCm, heightCm } = normalizeSize(product.shape, variant);
      const key = `${widthCm}x${heightCm}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "widthCm"],
          message: `Ya agregaste la medida ${formatMedida(widthCm, heightCm, product.shape)}.`,
        });
      }
      seen.add(key);
    });
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;

/** En redondos y cuadrados el alto es igual al ancho (diámetro o lado). */
export function normalizeSize(shape: MirrorShape, size: { widthCm: number; heightCm: number }) {
  return hasEqualSides(shape) ? { widthCm: size.widthCm, heightCm: size.widthCm } : size;
}

/** Variantes listas para guardar: medidas normalizadas y exactamente una por defecto. */
export function normalizeVariants(shape: MirrorShape, variants: VariantFormValues[]) {
  const defaultIndex = Math.max(
    variants.findIndex((variant) => variant.isDefault),
    0,
  );
  return variants.map((variant, index) => ({
    ...variant,
    ...normalizeSize(shape, variant),
    isDefault: index === defaultIndex,
  }));
}

export const emptyVariant = (): VariantFormValues => ({
  widthCm: Number.NaN,
  heightCm: Number.NaN,
  price: null,
  availability: "IN_STOCK",
  isDefault: false,
});
