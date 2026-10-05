import pg from "pg";

// Acceso directo a la BD desde las pruebas E2E (solo lectura de consultas y limpieza).
// Nunca contra Neon: si DATABASE_URL no apunta a localhost, las pruebas se detienen.

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL para las pruebas E2E.");
const { hostname } = new URL(url);
if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) {
  throw new Error(
    `Las pruebas E2E solo corren contra una BD local (DATABASE_URL apunta a ${hostname}).`,
  );
}

// allowExitOnIdle: el worker de Playwright termina sin cerrar el pool a mano.
const pool = new pg.Pool({ connectionString: url, max: 2, allowExitOnIdle: true });

export type InquiryRow = {
  code: string;
  type: string;
  status: string;
  source: string | null;
  city: string | null;
  needsShipping: boolean;
  needsInstallation: boolean;
  items: Array<{
    reference: string;
    productName: string;
    widthCm: number | null;
    heightCm: number | null;
    isCustomSize: boolean;
    priceSnapshot: number | null;
    customShape: string | null;
    frameDetails: string | null;
    hasLed: boolean | null;
    quantity: number;
    notes: string | null;
  }>;
};

export async function findInquiry(code: string): Promise<InquiryRow | null> {
  const { rows } = await pool.query<InquiryRow>(
    `SELECT i.code, i.type, i.status, i.source, i.city, i."needsShipping", i."needsInstallation",
            COALESCE(json_agg(json_build_object(
              'reference', it.reference, 'productName', it."productName",
              'widthCm', it."widthCm", 'heightCm', it."heightCm",
              'isCustomSize', it."isCustomSize", 'priceSnapshot', it."priceSnapshot",
              'customShape', it."customShape", 'frameDetails', it."frameDetails",
              'hasLed', it."hasLed", 'quantity', it.quantity, 'notes', it.notes
            )) FILTER (WHERE it.id IS NOT NULL), '[]') AS items
       FROM "Inquiry" i LEFT JOIN "InquiryItem" it ON it."inquiryId" = i.id
      WHERE i.code = $1
      GROUP BY i.id`,
    [code],
  );
  return rows[0] ?? null;
}

export async function deleteInquiries(codes: string[]) {
  if (codes.length > 0) await pool.query(`DELETE FROM "Inquiry" WHERE code = ANY($1)`, [codes]);
}

/** Las pruebas comparten IP: se reinicia el rate limit para no depender de corridas anteriores. */
export async function resetRateLimits() {
  await pool.query(`DELETE FROM "RequestThrottle" WHERE key LIKE 'inquiries:%'`);
}

/** Límite de intentos de login de Better Auth (activo en producción, como en CI): se vacía. */
export async function resetLoginRateLimits() {
  await pool.query(`DELETE FROM "rateLimit"`);
}
