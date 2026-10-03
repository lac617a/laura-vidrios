// Formulario «A la medida» (PRD §6.3.1): estado, pasos y validación. Puro: lo usan el formulario
// (cliente), el mensaje de WhatsApp y los tests. El servidor vuelve a validar el registro.

import type { MirrorShape } from "@/generated/prisma/enums";
import { formatMedida, hasEqualSides } from "@/lib/format";
import { INQUIRY_CITY_MAX } from "@/lib/whatsapp";

/** Formas que se ofrecen, en el orden de las tarjetas. */
export const CUSTOM_SHAPES: MirrorShape[] = [
  "RECTANGULAR",
  "SQUARE",
  "ROUND",
  "OVAL",
  "ARCH",
  "ORGANIC",
  "OTHER",
];

export const CUSTOM_QUANTITY_MAX = 50;
export const CUSTOM_NOTES_MAX = 500;
/** Opción de marco siempre disponible, además de las de la configuración. */
export const FRAME_RECOMMEND = "Que me recomienden";
/** Referencia del ítem de una consulta a la medida (no hay producto). */
export const CUSTOM_REFERENCE = "A-LA-MEDIDA";

export type CustomOrder = {
  shape: MirrorShape | null;
  /** Lo que escribe el cliente (texto del input); se valida al avanzar. */
  width: string;
  height: string;
  frame: string | null;
  hasLed: boolean | null;
  quantity: number;
  notes: string;
  needsShipping: boolean;
  needsInstallation: boolean;
  city: string;
};

export const EMPTY_ORDER: CustomOrder = {
  shape: null,
  width: "",
  height: "",
  frame: null,
  hasLed: null,
  quantity: 1,
  notes: "",
  needsShipping: false,
  needsInstallation: false,
  city: "",
};

export const CUSTOM_STEPS = [
  { id: "forma", title: "Forma" },
  { id: "medidas", title: "Medidas" },
  { id: "marco", title: "Marco y acabado" },
  { id: "detalles", title: "Luz y cantidad" },
  { id: "entrega", title: "Notas y entrega" },
  { id: "resumen", title: "Resumen" },
] as const;

export const SUMMARY_STEP = CUSTOM_STEPS.length - 1;

export type CustomLimits = { minCm: number; maxCm: number };

/** Medida en centímetros enteros; en redondos y cuadrados el alto es igual al ancho. */
export function customSize(order: CustomOrder): { widthCm: number; heightCm: number } | null {
  if (!order.shape || order.width === "") return null;
  const widthCm = Number(order.width);
  const equal = hasEqualSides(order.shape);
  if (!equal && order.height === "") return null;
  const heightCm = equal ? widthCm : Number(order.height);
  if (!Number.isInteger(widthCm) || !Number.isInteger(heightCm)) return null;
  return { widthCm, heightCm };
}

export function customSizeLabel(order: CustomOrder): string | null {
  const size = customSize(order);
  return size && order.shape ? formatMedida(size.widthCm, size.heightCm, order.shape) : null;
}

/** Notas listas para el mensaje: sin caracteres de control ni saltos de línea de más. */
export function normalizeNotes(notes: string): string {
  return notes
    .replace(/\r\n?/g, "\n")
    .replace(/[^\P{Cc}\n]/gu, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, CUSTOM_NOTES_MAX);
}

/** Error del paso, en palabras para el cliente; null si se puede avanzar. */
export function stepError(step: number, order: CustomOrder, limits: CustomLimits): string | null {
  switch (CUSTOM_STEPS[step]?.id) {
    case "forma":
      return order.shape ? null : "Elige una forma para continuar.";
    case "medidas": {
      const equal = order.shape !== null && hasEqualSides(order.shape);
      if (order.width === "" || (!equal && order.height === "")) {
        return equal ? "Escribe la medida." : "Escribe el ancho y el alto.";
      }
      const size = customSize(order);
      const inRange = (value: number) => value >= limits.minCm && value <= limits.maxCm;
      if (!size || !inRange(size.widthCm) || !inRange(size.heightCm)) {
        return `Las medidas van de ${limits.minCm} a ${limits.maxCm} cm, en números enteros.`;
      }
      return null;
    }
    case "marco":
      return order.frame ? null : `Elige un marco o «${FRAME_RECOMMEND}».`;
    case "detalles":
      if (order.hasLed === null) return "Indica si quieres luz LED.";
      return Number.isInteger(order.quantity) &&
        order.quantity >= 1 &&
        order.quantity <= CUSTOM_QUANTITY_MAX
        ? null
        : `La cantidad va de 1 a ${CUSTOM_QUANTITY_MAX}.`;
    default:
      return null;
  }
}

/** Primer paso con error (o el resumen si todo está completo). */
export function firstIncompleteStep(order: CustomOrder, limits: CustomLimits): number {
  for (let step = 0; step < SUMMARY_STEP; step++) {
    if (stepError(step, order, limits)) return step;
  }
  return SUMMARY_STEP;
}

// ── Borrador en el navegador ──────────────────────────────────────────────────

export const DRAFT_KEY = "a-la-medida:v1";
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type CustomDraft = { savedAt: number; step: number; order: CustomOrder };

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const digits = (value: unknown) => str(value, 4).replace(/\D/g, "");

/**
 * Lee un borrador guardado sin confiar en él: descarta campos inválidos, el marco si ya no se
 * ofrece y borradores viejos. El paso nunca queda después del primero incompleto.
 */
export function parseDraft(
  raw: unknown,
  options: { frameOptions: string[]; limits: CustomLimits; now: number },
): { step: number; order: CustomOrder } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const draft = raw as Partial<Record<keyof CustomDraft, unknown>>;
  if (typeof draft.savedAt !== "number" || options.now - draft.savedAt > DRAFT_MAX_AGE_MS) {
    return null;
  }
  const saved = (typeof draft.order === "object" && draft.order) || {};
  const value = saved as Partial<Record<keyof CustomOrder, unknown>>;

  const frames = [...options.frameOptions, FRAME_RECOMMEND];
  const quantity = Number(value.quantity);
  const order: CustomOrder = {
    shape: CUSTOM_SHAPES.includes(value.shape as MirrorShape) ? (value.shape as MirrorShape) : null,
    width: digits(value.width),
    height: digits(value.height),
    frame: typeof value.frame === "string" && frames.includes(value.frame) ? value.frame : null,
    hasLed: typeof value.hasLed === "boolean" ? value.hasLed : null,
    quantity:
      Number.isInteger(quantity) && quantity >= 1 && quantity <= CUSTOM_QUANTITY_MAX ? quantity : 1,
    notes: str(value.notes, CUSTOM_NOTES_MAX),
    needsShipping: value.needsShipping === true,
    needsInstallation: value.needsInstallation === true,
    city: str(value.city, INQUIRY_CITY_MAX),
  };

  const step = Number(draft.step);
  const maxStep = firstIncompleteStep(order, options.limits);
  return { step: Number.isInteger(step) && step >= 0 ? Math.min(step, maxStep) : 0, order };
}

// ── Vista previa ──────────────────────────────────────────────────────────────

/** Proporción de ejemplo mientras el cliente no escribe medidas válidas. */
export const PREVIEW_DEFAULT_SIZE: Record<MirrorShape, { widthCm: number; heightCm: number }> = {
  RECTANGULAR: { widthCm: 60, heightCm: 90 },
  SQUARE: { widthCm: 70, heightCm: 70 },
  ROUND: { widthCm: 70, heightCm: 70 },
  OVAL: { widthCm: 60, heightCm: 90 },
  ARCH: { widthCm: 60, heightCm: 100 },
  ORGANIC: { widthCm: 70, heightCm: 85 },
  OTHER: { widthCm: 60, heightCm: 80 },
};

const FRAME_COLORS: Array<[RegExp, string]> = [
  [/negro|grafito/, "#24211e"],
  [/dorado|oro|laton/, "#b8913a"],
  [/bronce|cobre/, "#8c6239"],
  [/blanco/, "#f3efe8"],
  [/madera|roble|nogal|pino/, "#9a6b3f"],
  [/plateado|plata|cromado|aluminio|acero/, "#b4b8bd"],
];

/**
 * Color y grosor aproximados del marco a partir del nombre de la opción ("Aluminio negro" →
 * negro). Sin marco, biselado o «que me recomienden»: solo el espejo.
 */
export function framePreview(frame: string | null): { color: string; width: number } {
  const name = (frame ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (!name || /sin marco|bisel|recomienden/.test(name))
    return { color: "rgba(0, 0, 0, 0)", width: 0 };
  const match = FRAME_COLORS.find(([pattern]) => pattern.test(name));
  return { color: match?.[1] ?? "#8a8178", width: 6 };
}
