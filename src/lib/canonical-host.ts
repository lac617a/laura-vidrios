// Redirección al dominio propio (PRD §2): cuando existe CANONICAL_HOST, cualquier otro host
// (*.vercel.app, www.…) responde 308 a la misma ruta en el dominio, con sus parámetros, así los
// enlaces ya enviados por WhatsApp siguen funcionando. Va en next.config.ts (redirects), que
// Vercel aplica en su capa de rutas sin ejecutar una función por visita.

import type { NextConfig } from "next";

type Redirect = Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>[number];

type Env = Partial<Record<"CANONICAL_HOST" | "VERCEL_ENV", string>>;

/** "Espejos.co/" o "https://espejos.co" → "espejos.co". Vacío si no hay dominio. */
export function normalizeHost(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

/** Los valores de `has`/`missing` son expresiones regulares: el punto se escapa. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function canonicalHostRedirects(env: Env): Redirect[] {
  const host = normalizeHost(env.CANONICAL_HOST);
  // Los previews tienen su propio host y nunca se redirigen.
  if (!host || env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") return [];

  return [
    {
      source: "/:path*",
      missing: [{ type: "host", value: escapeRegExp(host) }],
      destination: `https://${host}/:path*`,
      permanent: true,
    },
  ];
}
