import { track } from "@vercel/analytics";

// Eventos de analítica (Vercel Web Analytics: sin cookies, no guarda visitas en la BD).
// En desarrollo no envía nada; con <Analytics debug /> los muestra en la consola.

type AnalyticsEvents = {
  /** Clic en un botón que abre WhatsApp. `channel`: detalle, barra-movil, flotante, header… */
  whatsapp_click: { type: "CATALOG" | "GENERAL"; channel: string };
  /** Envío del formulario «A la medida» a WhatsApp. */
  custom_quote_click: { channel: string };
  /** Filtro aplicado en el catálogo: forma, ancho, precio, busqueda… (uno por cambio). */
  filter_used: { filter: string };
};
// Las vistas de producto no son un evento: son las visitas de /espejos/[slug] que Web Analytics
// ya cuenta por página.

export function trackEvent<Name extends keyof AnalyticsEvents>(
  name: Name,
  properties: AnalyticsEvents[Name],
) {
  try {
    track(name, properties);
  } catch {
    // La analítica nunca debe romper la navegación.
  }
}
