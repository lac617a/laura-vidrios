// Utilidades de WhatsApp (puras: sirven en cliente y servidor).
// El armado completo del mensaje de consulta llega en el Sprint 6.

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
