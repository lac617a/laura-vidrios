import { describe, expect, it } from "vitest";

import { joinList, normalizeSearchText, slugify, textBlocks } from "@/lib/text";

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("Espejo Redondo Luna LED")).toBe("espejo-redondo-luna-led");
    expect(slugify("Baño")).toBe("bano");
    expect(slugify("  Arco Florencia (copia) ")).toBe("arco-florencia-copia");
    expect(slugify("Ø 60 × 80")).toBe("60-80");
  });
});

describe("normalizeSearchText", () => {
  it("une partes sin tildes, en minúsculas", () => {
    expect(normalizeSearchText("Espejo Nórdico", "ESP-0003")).toBe("espejo nordico esp-0003");
    expect(normalizeSearchText("  Baño   Classic ", null, undefined)).toBe("bano classic");
  });
});

describe("joinList", () => {
  it("une con comas y «y»", () => {
    expect(joinList([])).toBe("");
    expect(joinList(["Bogotá"])).toBe("Bogotá");
    expect(joinList(["Bogotá", "Medellín"])).toBe("Bogotá y Medellín");
    expect(joinList(["Bogotá", "Chía", "Cota"])).toBe("Bogotá, Chía y Cota");
  });
});

describe("textBlocks", () => {
  it("títulos, listas y párrafos (las líneas seguidas forman un párrafo)", () => {
    const text = [
      "## Responsable",
      "Espejos Demo es responsable",
      "de tus datos.",
      "",
      "Tus derechos:",
      "- Conocer",
      "* Rectificar",
      "",
      "",
      "# Vigencia",
      "Desde hoy.",
    ].join("\r\n");
    expect(textBlocks(text)).toEqual([
      { type: "heading", text: "Responsable" },
      { type: "paragraph", text: "Espejos Demo es responsable de tus datos." },
      { type: "paragraph", text: "Tus derechos:" },
      { type: "list", items: ["Conocer", "Rectificar"] },
      { type: "heading", text: "Vigencia" },
      { type: "paragraph", text: "Desde hoy." },
    ]);
  });

  it("texto sin marcas: un párrafo por bloque", () => {
    expect(textBlocks("Uno\n\nDos")).toEqual([
      { type: "paragraph", text: "Uno" },
      { type: "paragraph", text: "Dos" },
    ]);
    expect(textBlocks("  \n ")).toEqual([]);
  });
});
