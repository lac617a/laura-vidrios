"use client";

import { AnimatePresence, LazyMotion, m, MotionConfig } from "motion/react";

import { ProductCard } from "@/components/catalog/product-card";
import type { CatalogCard } from "@/lib/catalog-public";

const loadFeatures = () => import("@/lib/motion-features").then((module) => module.default);

/**
 * Grid del catálogo. Al filtrar, las tarjetas que salen se desvanecen y las demás se
 * reacomodan con animación. La primera carga no se anima (no retrasa el LCP).
 */
export function ProductGrid({ cards }: { cards: CatalogCard[] }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false} mode="popLayout">
            {cards.map((card, index) => (
              <m.li
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard card={card} eager={index < 4} />
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </MotionConfig>
    </LazyMotion>
  );
}
