// Código de consulta (ej. K7M2QX): viaja en el mensaje de WhatsApp y la dueña lo busca en el admin.
// Puro: se genera en el navegador y se valida en el servidor.

/** Sin caracteres que se confunden al leerlos o dictarlos: 0/O, 1/I/L. */
export const INQUIRY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INQUIRY_CODE_LENGTH = 6;

const CODE_PATTERN = new RegExp(`^[${INQUIRY_CODE_ALPHABET}]{${INQUIRY_CODE_LENGTH}}$`);

/** Mayor múltiplo del alfabeto que cabe en un byte: descartar el resto evita el sesgo del módulo. */
const UNBIASED_LIMIT = 256 - (256 % INQUIRY_CODE_ALPHABET.length);

type RandomBytes = (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;

export function generateInquiryCode(
  randomBytes: RandomBytes = (bytes) => crypto.getRandomValues(bytes),
): string {
  let code = "";
  while (code.length < INQUIRY_CODE_LENGTH) {
    for (const byte of randomBytes(new Uint8Array(16))) {
      if (byte >= UNBIASED_LIMIT) continue;
      code += INQUIRY_CODE_ALPHABET[byte % INQUIRY_CODE_ALPHABET.length];
      if (code.length === INQUIRY_CODE_LENGTH) break;
    }
  }
  return code;
}

export function isInquiryCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}

/** Lo que la dueña escribe al buscar: "#k7m2qx " → "K7M2QX". */
export function normalizeInquiryCode(value: string): string {
  return value.trim().replace(/^#/, "").toUpperCase();
}
