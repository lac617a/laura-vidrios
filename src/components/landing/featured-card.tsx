"use client";

import { ProductCard } from "@/components/catalog/product-card";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import type { FeaturedProduct } from "@/lib/catalog-public";
import { formatCOP, formatMedida } from "@/lib/format";
import { inquirySource, registerInquiry, useInquiryCode } from "@/lib/inquiry-client";
import { buildProductInquiryMessage, buildWhatsappUrl } from "@/lib/whatsapp";

/**
 * Destacado de la landing (PRD RF-L03): la tarjeta lleva a la ficha y el botón consulta la medida
 * principal directo por WhatsApp (un toque desde la página de inicio).
 */
export function FeaturedCard({
  item,
  whatsappNumber,
  siteUrl,
}: {
  item: FeaturedProduct;
  whatsappNumber: string;
  siteUrl: string;
}) {
  const code = useInquiryCode();
  const { card, quick } = item;
  if (!quick || !whatsappNumber) return <ProductCard card={card} />;

  const href = buildWhatsappUrl(
    whatsappNumber,
    buildProductInquiryMessage({
      productName: card.name,
      reference: quick.sku,
      sizeLabel: formatMedida(quick.widthCm, quick.heightCm, card.shape),
      priceLabel: quick.price !== null ? formatCOP(quick.price) : null,
      url: `${siteUrl}/espejos/${card.slug}?medida=${quick.widthCm}x${quick.heightCm}`,
      needsShipping: false,
      needsInstallation: false,
      city: "",
      code,
    }),
  );

  return (
    <div className="flex h-full flex-col">
      <ProductCard card={card} />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar ${card.name} por WhatsApp`}
        onClick={() => {
          if (!code) return;
          const channel = "landing-destacados";
          registerInquiry(
            {
              type: "CATALOG",
              code,
              productId: quick.productId,
              sku: quick.sku,
              customSize: null,
              needsShipping: false,
              needsInstallation: false,
              city: "",
              source: inquirySource(channel),
            },
            channel,
          );
        }}
        className="mt-3 inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border px-4 text-sm font-medium transition-colors hover:border-whatsapp hover:text-whatsapp-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <WhatsappIcon className="size-4 text-whatsapp" />
        Consultar
      </a>
    </div>
  );
}
