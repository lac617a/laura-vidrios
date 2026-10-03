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

/** Lista en español: ["Bogotá", "Chía", "Cota"] → "Bogotá, Chía y Cota". */
export function joinList(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items.at(-1)}` : (items[0] ?? "");
}

export type TextBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/**
 * Texto que escribe la dueña (política de datos) → bloques para mostrar sin HTML:
 * "## Título", líneas con "- " como lista y párrafos separados por una línea en blanco.
 */
export function textBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (list.length > 0) blocks.push({ type: "list", items: list });
    paragraph = [];
    list = [];
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (/^#{1,3}\s+/.test(line)) {
      flush();
      blocks.push({ type: "heading", text: line.replace(/^#{1,3}\s+/, "") });
    } else if (/^[-•*]\s+/.test(line)) {
      if (paragraph.length > 0) flush();
      list.push(line.replace(/^[-•*]\s+/, ""));
    } else {
      if (list.length > 0) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
