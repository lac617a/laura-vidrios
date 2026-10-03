import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

// Rate limit en Postgres (tabla RequestThrottle): se comparte entre instancias serverless.
// Ventana fija por clave; una sola sentencia atómica cuenta y reinicia la ventana.

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Suma una petición a la clave. Devuelve false si ya se superó el límite de la ventana. */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<boolean> {
  // Horas en UTC (timestamp sin zona), igual que las fechas que escribe Prisma.
  const [row] = await prisma.$queryRaw<Array<{ count: number }>>`
    WITH clock AS (
      SELECT now() AT TIME ZONE 'UTC' AS "now",
             now() AT TIME ZONE 'UTC' - ${rule.windowSeconds}::int * interval '1 second' AS "expired"
    )
    INSERT INTO "RequestThrottle" ("key", "count", "windowStart")
    SELECT ${key}, 1, clock."now" FROM clock
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RequestThrottle"."windowStart" <= (SELECT "expired" FROM clock)
        THEN 1 ELSE "RequestThrottle"."count" + 1 END,
      "windowStart" = CASE WHEN "RequestThrottle"."windowStart" <= (SELECT "expired" FROM clock)
        THEN EXCLUDED."windowStart" ELSE "RequestThrottle"."windowStart" END
    RETURNING "count"`;
  return row.count <= rule.limit;
}

/** Borra las ventanas de más de un día (las claves llevan datos derivados de la IP). */
export async function pruneRateLimits() {
  await prisma.$executeRaw`
    DELETE FROM "RequestThrottle"
    WHERE "windowStart" < now() AT TIME ZONE 'UTC' - interval '1 day'`;
}

/** IP del cliente según el proxy de Vercel. En local suele no venir: todas comparten la clave. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Clave sin la IP en claro: "inquiries:" + hash. */
export function rateLimitKey(scope: string, ip: string): string {
  return `${scope}:${createHash("sha256").update(ip).digest("base64url").slice(0, 22)}`;
}
