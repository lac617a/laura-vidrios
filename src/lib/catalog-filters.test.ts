import { describe, expect, it } from "vitest";

import {
  appliedFilterNames,
  countActiveFilters,
  loadCatalogFilters,
  shapeSlugOf,
} from "@/lib/catalog-filters";

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

describe("appliedFilterNames", () => {
  it("cuenta los rangos como un solo filtro", () => {
    expect(appliedFilterNames({ anchoMin: 40, anchoMax: 90 })).toEqual(["ancho"]);
    expect(appliedFilterNames({ precioMin: null, precioMax: 500000 })).toEqual(["precio"]);
  });

  it("ignora lo que se quita y la paginación", () => {
    expect(appliedFilterNames({ forma: null, led: false, q: "", pagina: null })).toEqual([]);
    expect(appliedFilterNames({ marco: [] })).toEqual([]);
    expect(appliedFilterNames({ forma: ["redondo"], q: "luna" })).toEqual(["forma", "busqueda"]);
  });
});
