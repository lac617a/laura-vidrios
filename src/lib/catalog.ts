// Etiquetas en español de los enums del catálogo (cliente y servidor).

import type {
  Availability,
  InquiryStatus,
  InquiryType,
  MirrorShape,
  ProductStatus,
} from "@/generated/prisma/enums";

export const SHAPE_LABELS: Record<MirrorShape, string> = {
  RECTANGULAR: "Rectangular",
  SQUARE: "Cuadrado",
  ROUND: "Redondo",
  OVAL: "Ovalado",
  ARCH: "Arco",
  ORGANIC: "Orgánico",
  OTHER: "Otra forma",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IN_STOCK: "Disponible",
  MADE_TO_ORDER: "Bajo pedido",
  OUT_OF_STOCK: "Agotado",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  QUOTED: "Cotizada",
  WON: "Vendida",
  LOST: "Perdida",
};

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  CATALOG: "Catálogo",
  CUSTOM: "A la medida",
  GENERAL: "General",
};

/** Orden del embudo: Nueva → Contactada → Cotizada → Vendida / Perdida (PRD RF-A14). */
export const INQUIRY_STATUSES = Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[];

export const SHAPES = Object.keys(SHAPE_LABELS) as MirrorShape[];
export const AVAILABILITIES = Object.keys(AVAILABILITY_LABELS) as Availability[];
