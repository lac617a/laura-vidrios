import { after } from "next/server";

import { InquiryError, recordInquiry } from "@/lib/inquiries";
import { clientIp, consumeRateLimit, pruneRateLimits, rateLimitKey } from "@/lib/rate-limit";
import { inquiryPayloadSchema } from "@/lib/validations/inquiry";

// Registro de consultas: lo llama navigator.sendBeacon al tocar "Consultar por WhatsApp".
// WhatsApp ya se abrió con el mensaje; si esto falla, la consulta solo queda sin registrar.

const MAX_BODY_BYTES = 4096;
/** Por IP. Holgado: en Colombia muchos celulares comparten IP (CGNAT del operador). */
const RATE_LIMIT = { limit: 20, windowSeconds: 10 * 60 };

const headers = { "Cache-Control": "no-store" };

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers });
}

export async function POST(request: Request) {
  // Solo desde el propio sitio (los navegadores envían Sec-Fetch-Site con sendBeacon y fetch).
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return fail(403, "Origen no permitido.");
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return fail(413, "Consulta demasiado grande.");
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return fail(413, "Consulta demasiado grande.");

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return fail(400, "Formato inválido.");
  }
  const parsed = inquiryPayloadSchema.safeParse(json);
  if (!parsed.success) return fail(400, "Datos de consulta inválidos.");

  try {
    const key = rateLimitKey("inquiries", clientIp(request.headers));
    if (!(await consumeRateLimit(key, RATE_LIMIT))) {
      return fail(429, "Demasiadas consultas seguidas. Intenta en unos minutos.");
    }
    const { code } = await recordInquiry(parsed.data);

    // De vez en cuando borra ventanas vencidas, después de responder.
    if (Math.random() < 0.02) after(pruneRateLimits);

    return Response.json({ code }, { status: 201, headers });
  } catch (error) {
    if (error instanceof InquiryError) return fail(error.status, error.message);
    console.error("[api/inquiries]", error);
    return fail(500, "No se pudo registrar la consulta.");
  }
}
