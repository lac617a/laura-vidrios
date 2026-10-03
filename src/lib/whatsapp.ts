// Utilidades de WhatsApp (puras: sirven en cliente y servidor).
// Los mensajes siguen el formato del PRD §5 y van sin emojis a propósito (se ven mal en algunos
// teléfonos). El registro de la consulta vive en `inquiry-client.ts`.

const COLOMBIA_CODE = "57";

/** Largo máximo de la ciudad que escribe el cliente (también lo valida el servidor). */
export const INQUIRY_CITY_MAX = 60;

/**
 * Normaliza un celular colombiano al formato de wa.me: "57" + 10 dígitos que empiezan por 3.
 * Acepta "+57 300 123 4567", "3001234567", "573001234567"… Devuelve null si no es válido.
 */
export function normalizeWhatsappNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith(COLOMBIA_CODE) ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? `${COLOMBIA_CODE}${local}` : null;
}

/** "573001234567" → "+57 300 123 4567" */
export function formatWhatsappNumber(number: string): string {
  const match = /^57(\d{3})(\d{3})(\d{4})$/.exec(number);
  return match ? `+57 ${match[1]} ${match[2]} ${match[3]}` : number;
}

/** Enlace wa.me con el texto prellenado. */
export function buildWhatsappUrl(number: string, text?: string): string {
  const url = `https://wa.me/${number}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export type ProductInquiryMessage = {
  productName: string;
  /** SKU de la medida elegida, o la referencia del producto si es una medida personalizada. */
  reference: string;
  sizeLabel: string;
  /** null = sin precio visible (a consultar o medida personalizada). */
  priceLabel: string | null;
  url: string;
  needsShipping: boolean;
  needsInstallation: boolean;
  city: string;
  /** Código de consulta; null mientras no exista (antes de hidratar). */
  code: string | null;
};

/** Mensaje prellenado para consultar un producto. */
export function buildProductInquiryMessage(input: ProductInquiryMessage): string {
  const lines = [
    "Hola, vi este espejo en la web y me interesa:",
    "",
    input.productName,
    `Ref: ${input.reference}`,
    `Medida: ${input.sizeLabel}`,
  ];
  if (input.priceLabel) lines.push(`Precio: ${input.priceLabel}`);
  lines.push(input.url);
  lines.push(...serviceLines(input));

  lines.push("");
  if (input.code) lines.push(`Código de consulta: #${input.code}`);
  lines.push("¿Está disponible?");
  return lines.join("\n");
}

export type CustomInquiryMessage = {
  shapeLabel: string;
  sizeLabel: string;
  frame: string;
  hasLed: boolean;
  quantity: number;
  /** Ya normalizadas (`normalizeNotes`); pueden tener saltos de línea. */
  notes: string;
  needsShipping: boolean;
  needsInstallation: boolean;
  city: string;
  code: string | null;
};

/** Mensaje del formulario «A la medida» (PRD §5, segundo ejemplo). */
export function buildCustomInquiryMessage(input: CustomInquiryMessage): string {
  const lines = [
    "Hola, quiero cotizar un espejo a la medida:",
    "",
    `Forma: ${input.shapeLabel}`,
    `Medida: ${input.sizeLabel}`,
    `Marco: ${input.frame}`,
    `Luz LED: ${input.hasLed ? "Sí" : "No"}`,
    `Cantidad: ${input.quantity}`,
  ];
  const notes = input.notes.trim();
  if (notes) lines.push(`Notas: ${notes}`);
  lines.push(...serviceLines(input));
  if (input.code) lines.push("", `Código de consulta: #${input.code}`);
  return lines.join("\n");
}

/** Mensaje del botón flotante (consulta general). */
export function buildGeneralInquiryMessage(code: string | null): string {
  const lines = ["Hola, vengo de la página web y quiero más información."];
  if (code) lines.push("", `Código de consulta: #${code}`);
  return lines.join("\n");
}

/** Bloque "Necesito: envío e instalación / Ciudad: …", precedido de una línea en blanco. */
function serviceLines(input: { needsShipping: boolean; needsInstallation: boolean; city: string }) {
  const services = [
    input.needsShipping && "envío",
    input.needsInstallation && "instalación",
  ].filter(Boolean);
  const city = input.city.trim();
  const lines: string[] = [];
  if (services.length > 0) lines.push(`Necesito: ${services.join(" e ")}`);
  if (city) lines.push(`Ciudad: ${city}`);
  return lines.length > 0 ? ["", ...lines] : [];
}
