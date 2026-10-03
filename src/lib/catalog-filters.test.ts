import { describe, expect, it } from "vitest";

import { countActiveFilters, loadCatalogFilters, shapeSlugOf } from "@/lib/catalog-filters";

describe("loadCatalogFilters", () => {
  it("lee la URL en español", () => {
    const filters = loadCatalogFilters(
      new URLSearchParams(
        "q=luna&categoria=bano&forma=redondo,ovalado&led=true&ancho_max=80&precio_min=200000&pagina=2",
      ),
    );
    expect(filters).toMatchObject({
      q: "luna",
      categoria: "bano",
      forma: ["redondo", "ovalado"],
      led: true,
      anchoMax: 80,
      precioMin: 200000,
      pagina: 2,
    });
  });

  it("ignora valores inválidos y usa los valores por defecto", () => {
    const filters = loadCatalogFilters(new URLSearchParams("forma=triangular&led=quizas&pagina=x"));
    expect(filters.forma).toEqual([]);
    expect(filters.led).toBe(false);
    expect(filters.pagina).toBe(1);
    expect(filters.anchoMin).toBeNull();
  });
});

describe("countActiveFilters", () => {
  it("cuenta grupos activos sin contar la búsqueda ni la página", () => {
    const none = loadCatalogFilters(new URLSearchParams("q=luna&pagina=3"));
    expect(countActiveFilters(none)).toBe(0);
    const some = loadCatalogFilters(
      new URLSearchParams("forma=redondo,arco&ancho_min=40&ancho_max=90&disponible=true"),
    );
    expect(countActiveFilters(some)).toBe(3);
  });
});

describe("shapeSlugOf", () => {
  it("traduce el enum a la URL", () => {
    expect(shapeSlugOf("ROUND")).toBe("redondo");
    expect(shapeSlugOf("ORGANIC")).toBe("organico");
  });
});
