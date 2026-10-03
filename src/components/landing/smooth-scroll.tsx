"use client";

import "lenis/dist/lenis.css";

import type Lenis from "lenis";
import { useEffect } from "react";

/**
 * Scroll suave con Lenis, solo en la landing y solo con rueda o trackpad: en pantallas táctiles
 * queda el scroll nativo. Se apaga con movimiento reducido. Lenis se descarga después de hidratar
 * (no suma al JavaScript inicial). Al salir de la página, o cuando Next la oculta con <Activity>,
 * la limpieza del efecto lo destruye.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: Lenis | undefined;
    let cancelled = false;
    void import("lenis").then(({ default: LenisClass }) => {
      if (!cancelled) lenis = new LenisClass({ autoRaf: true, anchors: true, lerp: 0.12 });
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);
  return null;
}
