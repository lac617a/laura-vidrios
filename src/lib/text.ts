// Utilidades de texto puras: se usan en la app, en el seed y en los scripts.

/** Quita tildes y diacríticos: "Bogotá" → "Bogota". */
export function removeDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Texto para búsqueda: sin tildes, en minúsculas y con espacios simples. */
export function normalizeSearchText(...parts: Array<string | null | undefined>): string {
  return removeDiacritics(parts.filter(Boolean).join(" "))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Slug para URLs: "Espejo Redondo Luna LED" → "espejo-redondo-luna-led". */
export function slugify(value: string): string {
  return removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
