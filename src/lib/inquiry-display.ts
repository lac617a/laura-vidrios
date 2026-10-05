// Presentación de consultas en el admin (pura).

import type { MirrorShape } from "@/generated/prisma/enums";
import { SHAPE_LABELS } from "@/lib/catalog";
import { formatMedida } from "@/lib/format";

type ItemSize = {
  widthCm: number | null;
  heightCm: number | null;
  customShape: MirrorShape | null;
};

/** "60 × 80 cm" u "Ø 90 cm" (la forma de un espejo a la medida ya va en su nombre). */
export function inquiryItemSize(item: ItemSize): string | null {
  if (item.widthCm === null || item.heightCm === null) return null;
  return formatMedida(item.widthCm, item.heightCm, item.customShape ?? undefined);
}

/** "Redondo" para ítems a la medida; null en productos del catálogo. */
export function inquiryItemShape(item: ItemSize): string | null {
  return item.customShape ? SHAPE_LABELS[item.customShape] : null;
}

/** "Envío e instalación", "Envío", … o null. */
export function inquiryServices(inquiry: {
  needsShipping: boolean;
  needsInstallation: boolean;
}): string | null {
  const services = [inquiry.needsShipping && "envío", inquiry.needsInstallation && "instalación"]
    .filter(Boolean)
    .join(" e ");
  return services ? services[0].toUpperCase() + services.slice(1) : null;
}

/** URL del listado con los filtros actuales y un cambio (null borra el parámetro). */
export function inquiriesHref(
  current: Record<string, string | number>,
  patch: Record<string, string | number | null>,
  defaults: Record<string, string | number> = DEFAULTS,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value === null || value === "" || defaults[key] === value) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/admin/consultas?${query}` : "/admin/consultas";
}

const DEFAULTS: Record<string, string | number> = {
  estado: "todas",
  tipo: "todos",
  periodo: "todo",
  pagina: 1,
};
