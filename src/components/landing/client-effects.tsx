"use client";

import { useEffect, useRef, useState } from "react";

// Efectos de la landing que necesitan JavaScript, lo más livianos posible (sin Motion: la landing
// tiene presupuesto de rendimiento, Lighthouse móvil ≥ 90).

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Un solo IntersectionObserver para todos los `[data-reveal]` de la página: les pone
 * `data-visible` al entrar en pantalla y deja de observarlos.
 */
export function RevealObserver() {
  useEffect(() => {
    const pending = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-visible])");
    const show = (element: Element) => element.setAttribute("data-visible", "");
    if (!("IntersectionObserver" in window)) {
      pending.forEach(show);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    pending.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return null;
}

/**
 * Cifra que sube desde 0 al aparecer. El HTML del servidor trae el valor final (buscadores y sin
 * JavaScript); la cuenta empieza cuando el número entra en pantalla.
 */
export function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion() || !("IntersectionObserver" in window)) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const duration = 1400;
        let start: number | null = null;
        frame = requestAnimationFrame(function tick(now) {
          start ??= now;
          const progress = Math.min((now - start) / duration, 1);
          // easeOutCubic: rápido al inicio, se asienta al final.
          setDisplay(Math.round(value * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString("es-CO")}
    </span>
  );
}
