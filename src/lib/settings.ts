import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/lib/prisma";

export const SETTINGS_TAG = "settings";

const settingsSelect = {
  businessName: true,
  logoUrl: true,
  whatsappNumber: true,
  messageTemplate: true,
  currencyCode: true,
  locale: true,
  referencePrefix: true,
  shippingInfo: true,
  installationInfo: true,
  coverageAreas: true,
  customMinCm: true,
  customMaxCm: true,
  customFrameOptions: true,
  privacyPolicy: true,
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
  address: true,
  openingHours: true,
} as const;

export type SiteSettings = {
  businessName: string;
  logoUrl: string | null;
  whatsappNumber: string;
  messageTemplate: string | null;
  currencyCode: string;
  locale: string;
  referencePrefix: string;
  shippingInfo: string | null;
  installationInfo: string | null;
  coverageAreas: string[];
  customMinCm: number;
  customMaxCm: number;
  customFrameOptions: string[];
  privacyPolicy: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  address: string | null;
  openingHours: string | null;
};

/** Valores cuando aún no se guardó la configuración (BD de producción recién creada). */
export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Catálogo de espejos",
  logoUrl: null,
  whatsappNumber: "",
  messageTemplate: null,
  currencyCode: "COP",
  locale: "es-CO",
  referencePrefix: "ESP",
  shippingInfo: null,
  installationInfo: null,
  coverageAreas: [],
  customMinCm: 20,
  customMaxCm: 250,
  customFrameOptions: [],
  privacyPolicy: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  address: null,
  openingHours: null,
};

async function readSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: settingsSelect });
  return row ?? DEFAULT_SETTINGS;
}

/**
 * Configuración para el sitio público: cacheada e invalidada con updateTag(SETTINGS_TAG)
 * cuando el admin guarda cambios.
 */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("max");
  return readSettings();
}

/** Lectura sin caché para el formulario del admin. */
export async function getSettingsFresh(): Promise<SiteSettings> {
  return readSettings();
}
