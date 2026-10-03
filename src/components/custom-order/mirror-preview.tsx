"use client";

import { LazyMotion, m, MotionConfig } from "motion/react";

import type { MirrorShape } from "@/generated/prisma/enums";
import {
  customSize,
  framePreview,
  PREVIEW_DEFAULT_SIZE,
  type CustomOrder,
} from "@/lib/custom-order";
import { hasEqualSides } from "@/lib/format";
import { cn } from "@/lib/utils";

const loadFeatures = () => import("@/lib/motion-features-basic").then((module) => module.default);

const SPRING = { type: "spring", stiffness: 170, damping: 24 } as const;

/** Radios de las 4 esquinas (horizontal / vertical, en px) según la forma: Motion los interpola. */
function borderRadius(shape: MirrorShape, width: number, height: number): string {
  const corners = (h: number[], v: number[]) =>
    `${h.map((value) => `${value}px`).join(" ")} / ${v.map((value) => `${value}px`).join(" ")}`;
  const flat = 4;
  switch (shape) {
    case "ROUND":
    case "OVAL":
      return corners(
        [width / 2, width / 2, width / 2, width / 2],
        [height / 2, height / 2, height / 2, height / 2],
      );
    case "ARCH": {
      const top = Math.min(width / 2, height);
      return corners([width / 2, width / 2, flat, flat], [top, top, flat, flat]);
    }
    case "ORGANIC":
      return corners(
        [0.48, 0.52, 0.4, 0.6].map((ratio) => ratio * width),
        [0.55, 0.45, 0.55, 0.45].map((ratio) => ratio * height),
      );
    case "OTHER":
      return corners([16, 16, 16, 16], [16, 16, 16, 16]);
    default:
      return corners([flat, flat, flat, flat], [flat, flat, flat, flat]);
  }
}

// Mismas tres sombras siempre (brillo interno, luz LED y sombra), para que Motion las interpole.
const SHADOW_OFF =
  "inset 0px 0px 0px 1px rgba(255, 255, 255, 0.7), 0px 0px 0px 0px rgba(255, 214, 150, 0), 0px 12px 30px -12px rgba(60, 50, 40, 0.35)";
const SHADOW_LED =
  "inset 0px 0px 0px 1px rgba(255, 255, 255, 0.7), 0px 0px 34px 10px rgba(255, 214, 150, 0.75), 0px 12px 30px -12px rgba(60, 50, 40, 0.35)";

/**
 * Vista previa en vivo (PRD RF-M02): forma y proporción de las medidas, marco aproximado y luz LED.
 * Decorativa: el resumen en texto está en el formulario.
 */
export function MirrorPreview({
  order,
  stage,
  className,
}: {
  order: CustomOrder;
  /** Lado máximo del espejo dibujado, en px. */
  stage: number;
  className?: string;
}) {
  const shape = order.shape ?? "RECTANGULAR";
  const typed = customSize(order);
  const real = typed !== null && typed.widthCm > 0 && typed.heightCm > 0;
  const size = real ? typed : PREVIEW_DEFAULT_SIZE[shape];
  const scale = stage / Math.max(size.widthCm, size.heightCm);
  const width = Math.max(28, Math.round(size.widthCm * scale));
  const height = Math.max(28, Math.round(size.heightCm * scale));
  const frame = framePreview(order.frame);
  const equalSides = hasEqualSides(shape);

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div
          aria-hidden
          className={cn("flex items-center justify-center rounded-2xl bg-muted", className)}
          style={{ minHeight: stage + 72 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-2">
              <m.div
                className={cn("mirror-surface", !order.shape && "opacity-40")}
                initial={false}
                animate={{
                  width,
                  height,
                  borderRadius: borderRadius(shape, width, height),
                  borderWidth: frame.width,
                  borderColor: frame.color,
                  boxShadow: order.hasLed ? SHADOW_LED : SHADOW_OFF,
                }}
                transition={SPRING}
                style={{ borderStyle: "solid" }}
              />
              <Dimension
                length={width}
                label={real ? (shape === "ROUND" ? `Ø ${size.widthCm}` : `${size.widthCm}`) : null}
              />
            </div>
            {!equalSides && (
              <Dimension vertical length={height} label={real ? `${size.heightCm}` : null} />
            )}
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

/** Cota con la medida en cm (horizontal debajo del espejo, vertical a su lado). */
function Dimension({
  length,
  label,
  vertical = false,
}: {
  length: number;
  label: string | null;
  vertical?: boolean;
}) {
  return (
    <m.div
      initial={false}
      animate={vertical ? { height: length } : { width: length }}
      transition={SPRING}
      className={cn(
        "relative flex items-center justify-center text-muted-foreground",
        vertical ? "w-px border-l border-foreground/25" : "h-px border-t border-foreground/25",
        !label && "opacity-0",
      )}
    >
      <span
        className={cn(
          "absolute bg-muted px-1 text-xs whitespace-nowrap tabular-nums",
          vertical && "left-1.5",
        )}
      >
        {label} cm
      </span>
    </m.div>
  );
}
