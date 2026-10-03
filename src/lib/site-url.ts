// URL absoluta del sitio (servidor): enlaces en mensajes de WhatsApp, JSON-LD y metadatos.
// En previews de Vercel, si no se definió NEXT_PUBLIC_SITE_URL, usa el host del deploy.

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
