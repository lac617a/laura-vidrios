// Utilidades de WhatsApp (puras: sirven en cliente y servidor).
// El código de consulta y su registro llegan en el Sprint 6.

const COLOMBIA_CODE = "57";

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
  /** Código de consulta (Sprint 6). */
  code?: string;
};

/** Mensaje prellenado para consultar un producto (formato del PRD §5). Sin emojis a propósito. */
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

  const services = [
    input.needsShipping && "envío",
    input.needsInstallation && "instalación",
  ].filter(Boolean);
  const city = input.city.trim();
  if (services.length > 0 || city) lines.push("");
  if (services.length > 0) lines.push(`Necesito: ${services.join(" e ")}`);
  if (city) lines.push(`Ciudad: ${city}`);

  lines.push("");
  if (input.code) lines.push(`Código de consulta: #${input.code}`);
  lines.push("¿Está disponible?");
  return lines.join("\n");
}
