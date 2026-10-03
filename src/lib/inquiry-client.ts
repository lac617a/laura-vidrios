import { useSyncExternalStore } from "react";

import { trackEvent } from "@/lib/analytics";
import { generateInquiryCode } from "@/lib/inquiry-code";
import type { InquiryPayload } from "@/lib/validations/inquiry";

// Consultas desde el navegador (PRD RF-W03): el botón es un <a href="https://wa.me/…"> real que ya
// lleva el código en el mensaje; al tocarlo, el registro sale con sendBeacon y WhatsApp abre al
// instante aunque falle la red o la BD (y Safari en iOS no lo bloquea, porque no hay await).

const ENDPOINT = "/api/inquiries";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

// ── Código de consulta compartido por todos los botones de la página ──────────
// Solo existe en el navegador: en el servidor (y al hidratar) es null, así no entra en el HTML
// prerenderizado ni se generan valores aleatorios durante el render en el servidor.

let currentCode: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCode() {
  currentCode ??= generateInquiryCode();
  return currentCode;
}

function renewCode() {
  currentCode = generateInquiryCode();
  for (const listener of listeners) listener();
}

/** Código de la próxima consulta (null antes de hidratar: el mensaje sale sin código). */
export function useInquiryCode(): string | null {
  return useSyncExternalStore(subscribe, getCode, () => null);
}

// ── Registro ──────────────────────────────────────────────────────────────────

/**
 * Llamar en el onClick del enlace a WhatsApp, sin preventDefault. Registra la consulta, envía el
 * evento de analítica y prepara un código nuevo para la siguiente consulta.
 */
export function registerInquiry(payload: InquiryPayload, channel: string) {
  const body = JSON.stringify(payload);
  try {
    // Texto plano: tipo de contenido simple, que sendBeacon acepta en todos los navegadores.
    const queued = navigator.sendBeacon?.(ENDPOINT, body);
    if (!queued) {
      void fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Sin registro, pero WhatsApp abre igual.
  }
  trackEvent("whatsapp_click", { type: payload.type, channel });

  // En un macrotask: el navegador ya leyó el href de este clic. Si se renovara aquí mismo, React
  // podría actualizar el enlace antes de que se abra y el mensaje llevaría otro código.
  setTimeout(renewCode, 0);
}

/** Canal y campaña de la visita: "detalle utm_source=instagram utm_campaign=navidad". */
export function inquirySource(channel: string): string {
  const params = new URLSearchParams(window.location.search);
  const utm = UTM_KEYS.flatMap((key) => {
    const value = params
      .get(key)
      ?.replace(/\p{Cc}/gu, "")
      .trim();
    return value ? [`${key}=${value}`] : [];
  });
  return [channel, ...utm].join(" ").slice(0, 200);
}
