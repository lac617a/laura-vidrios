"use client";

/** Oculta el botón flotante de WhatsApp en páginas que ya terminan en WhatsApp. */
export const HIDE_WHATSAPP_FLOAT = "[data-whatsapp-float]{display:none}";

/**
 * Estilos globales mientras la página está visible. Next guarda las páginas visitadas ocultas en
 * el DOM (<Activity>): al ocultarse, la limpieza del ref desactiva la hoja con media="not all"
 * para que no afecte a la página visible. Viene en el HTML del servidor: sin parpadeo al cargar.
 */
export function PageStyles({ css }: { css: string }) {
  return (
    <style
      ref={(style) => {
        if (style) style.media = "all";
        return () => {
          if (style) style.media = "not all";
        };
      }}
    >
      {css}
    </style>
  );
}
