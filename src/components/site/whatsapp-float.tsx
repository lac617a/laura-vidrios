import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { WhatsappIcon } from "@/components/whatsapp-icon";

/**
 * Botón flotante de WhatsApp en el sitio público (consulta GENERAL, PRD RF-L06).
 * No aparece en la ficha de producto: ahí manda su propio botón de consulta (ver globals.css).
 */
export function WhatsappFloat({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <GeneralWhatsappLink
      whatsappNumber={whatsappNumber}
      channel="flotante"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      data-whatsapp-float=""
      className="whatsapp-pulse fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex size-14 animate-in items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/20 transition-[background-color,scale] duration-200 zoom-in-50 fade-in hover:scale-105 hover:bg-whatsapp-hover focus-visible:ring-4 focus-visible:ring-whatsapp/40 focus-visible:outline-none active:scale-95 motion-reduce:animate-none motion-reduce:transition-none sm:right-6 sm:bottom-6"
    >
      <WhatsappIcon className="size-7" />
    </GeneralWhatsappLink>
  );
}
