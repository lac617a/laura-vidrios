import { z } from "zod";

import { isOwnCloudinaryUrl } from "@/lib/cloudinary";

/** Texto opcional recortado, con máximo de caracteres. */
export const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`);

/** Slug opcional: vacío = se genera desde el nombre. */
export const optionalSlug = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "Máximo 120 caracteres.")
  .refine((value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
    message: "Solo minúsculas, números y guiones (ej. espejo-redondo-luna).",
  });

export const nullIfEmpty = (value: string) => (value === "" ? null : value);

/** Imagen opcional subida desde el panel (vacío = sin imagen). */
export const optionalImageUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || isOwnCloudinaryUrl(value), {
    message: "Sube la imagen desde el panel.",
  });
