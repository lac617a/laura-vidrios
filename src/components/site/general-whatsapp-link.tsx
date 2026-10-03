"use client";

import type { ComponentProps } from "react";

import { inquirySource, registerInquiry, useInquiryCode } from "@/lib/inquiry-client";
import { buildGeneralInquiryMessage, buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * Enlace a WhatsApp para una consulta general (header, botón flotante…): mensaje con código y
 * registro tipo GENERAL. `channel` identifica el botón en la consulta y en la analítica.
 */
export function GeneralWhatsappLink({
  whatsappNumber,
  channel,
  onClick,
  ...props
}: { whatsappNumber: string; channel: string } & Omit<
  ComponentProps<"a">,
  "href" | "target" | "rel"
>) {
  const code = useInquiryCode();

  return (
    <a
      {...props}
      href={buildWhatsappUrl(whatsappNumber, buildGeneralInquiryMessage(code))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        onClick?.(event);
        if (!code) return;
        registerInquiry(
          {
            type: "GENERAL",
            code,
            source: inquirySource(`${channel} ${window.location.pathname}`),
          },
          channel,
        );
      }}
    />
  );
}
