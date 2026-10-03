// Filtros del catálogo público en la URL (compartibles y con "atrás" funcionando).
// Los mismos parsers sirven en el servidor (createLoader) y en el cliente (useQueryStates).

import {
  createLoader,
  type inferParserType,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import type { MirrorShape } from "@/generated/prisma/enums";

/** Forma en la URL (español) ↔ enum. */
export const SHAPE_SLUGS = {
  rectangular: "RECTANGULAR",
  cuadrado: "SQUARE",
  redondo: "ROUND",
  ovalado: "OVAL",
  arco: "ARCH",
  organico: "ORGANIC",
  otra: "OTHER",
} as const satisfies Record<string, MirrorShape>;

export type ShapeSlug = keyof typeof SHAPE_SLUGS;
const shapeSlugs = Object.keys(SHAPE_SLUGS) as ShapeSlug[];

export function shapeSlugOf(shape: MirrorShape): ShapeSlug {
  return shapeSlugs.find((slug) => SHAPE_SLUGS[slug] === shape) ?? "otra";
}

export const catalogParsers = {
  q: parseAsString.withDefault(""),
  categoria: parseAsString.withDefault(""),
  forma: parseAsArrayOf(parseAsStringLiteral(shapeSlugs)).withDefault([]),
  marco: parseAsArrayOf(parseAsString).withDefault([]),
  led: parseAsBoolean.withDefault(false),
  disponible: parseAsBoolean.withDefault(false),
  anchoMin: parseAsInteger,
  anchoMax: parseAsInteger,
  altoMin: parseAsInteger,
  altoMax: parseAsInteger,
  precioMin: parseAsInteger,
  precioMax: parseAsInteger,
  pagina: parseAsInteger.withDefault(1),
};

export const catalogUrlKeys = {
  anchoMin: "ancho_min",
  anchoMax: "ancho_max",
  altoMin: "alto_min",
  altoMax: "alto_max",
  precioMin: "precio_min",
  precioMax: "precio_max",
} as const;

export const loadCatalogFilters = createLoader(catalogParsers, { urlKeys: catalogUrlKeys });

export type CatalogFilters = inferParserType<typeof catalogParsers>;

/** Cuántos filtros hay activos (sin contar búsqueda ni página). */
export function countActiveFilters(filters: CatalogFilters): number {
  return [
    filters.categoria !== "",
    filters.forma.length > 0,
    filters.marco.length > 0,
    filters.led,
    filters.disponible,
    filters.anchoMin !== null || filters.anchoMax !== null,
    filters.altoMin !== null || filters.altoMax !== null,
    filters.precioMin !== null || filters.precioMax !== null,
  ].filter(Boolean).length;
}
