"use client";

import Link from "next/link";

import { MirrorPlaceholder } from "@/components/catalog/mirror-placeholder";
import { CloudinaryImage } from "@/components/cloudinary-image";
import type { CatalogCard } from "@/lib/catalog-public";

/**
 * Tarjeta del catálogo: foto 4:5, segunda foto y brillo al pasar el cursor.
 * `eager`: las primeras del grid cargan sin esperar (no se precargan: varias pueden ser el LCP).
 */
export function ProductCard({ card, eager = false }: { card: CatalogCard; eager?: boolean }) {
  const [cover, second] = card.images;

  return (
    <Link
      href={`/espejos/${card.slug}`}
      className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted">
        {cover ? (
          <>
            <CloudinaryImage
              src={cover.publicId}
              preset="card"
              alt={cover.alt ?? card.name}
              fill
              loading={eager ? "eager" : undefined}
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
            />
            {second && (
              <CloudinaryImage
                src={second.publicId}
                preset="card"
                alt=""
                fill
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
              />
            )}
          </>
        ) : (
          <MirrorPlaceholder shape={card.shape} />
        )}
        <span className="mirror-sheen" aria-hidden />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {card.hasLed && (
            <span className="rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur">
              Luz LED
            </span>
          )}
          {card.madeToOrder && (
            <span className="rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur">
              Bajo pedido
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="leading-snug font-medium text-balance group-hover:underline group-hover:underline-offset-4">
          {card.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {card.sizeLabel} · Ref. {card.reference}
        </p>
        <p className="pt-1 text-sm font-semibold tabular-nums">{card.priceLabel}</p>
      </div>
    </Link>
  );
}
