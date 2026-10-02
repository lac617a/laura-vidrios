// Formatos para Colombia (puros: cliente y servidor).

import type { MirrorShape } from "@/generated/prisma/enums";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const thousandsFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** 850000 → "$ 850.000" */
export function formatCOP(value: number): string {
  return copFormatter.format(value);
}

/** 850000 → "850.000" (para inputs con máscara). */
export function formatThousands(value: number): string {
  return thousandsFormatter.format(value);
}

/** "$ 850.000" → 850000 · "" → null */
export function parseDigits(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** Formas que se miden con un solo valor (diámetro o lado). */
export function hasEqualSides(shape: MirrorShape): boolean {
  return shape === "ROUND" || shape === "SQUARE";
}

/** Medida legible: "60 × 80 cm" · redondos "Ø 60 cm". */
export function formatMedida(widthCm: number, heightCm: number, shape?: MirrorShape): string {
  if (shape === "ROUND") return `Ø ${widthCm} cm`;
  return `${widthCm} × ${heightCm} cm`;
}

type Size = { widthCm: number; heightCm: number };

/** Rango de medidas de un producto: "50 × 70 a 70 × 90 cm" · "Ø 50 a Ø 70 cm". */
export function formatSizeRange(sizes: Size[], shape?: MirrorShape): string {
  if (sizes.length === 0) return "Sin medidas";
  const sorted = [...sizes].sort((a, b) => a.widthCm * a.heightCm - b.widthCm * b.heightCm);
  const smallest = sorted[0];
  const largest = sorted[sorted.length - 1];
  if (
    sorted.length === 1 ||
    (smallest.widthCm === largest.widthCm && smallest.heightCm === largest.heightCm)
  ) {
    return formatMedida(smallest.widthCm, smallest.heightCm, shape);
  }
  const from = formatMedida(smallest.widthCm, smallest.heightCm, shape).replace(/ cm$/, "");
  return `${from} a ${formatMedida(largest.widthCm, largest.heightCm, shape)}`;
}

/** Precio para listados: "$ 850.000", "Desde $ 520.000" o "A consultar". */
export function formatPriceFrom(prices: Array<number | null>, showPrice: boolean): string {
  const valid = prices.filter((price): price is number => price !== null);
  if (!showPrice || valid.length === 0) return "A consultar";
  const min = Math.min(...valid);
  return new Set(valid).size > 1 ? `Desde ${formatCOP(min)}` : formatCOP(min);
}

/** ("ESP", 12) → "ESP-0012" */
export function formatReference(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

/** ("ESP-0012", 60, 80) → "ESP-0012-60x80" */
export function variantSku(reference: string, widthCm: number, heightCm: number): string {
  return `${reference}-${widthCm}x${heightCm}`;
}
