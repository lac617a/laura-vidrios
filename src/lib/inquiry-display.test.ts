import { describe, expect, it } from "vitest";

import {
  inquiriesHref,
  inquiryItemShape,
  inquiryItemSize,
  inquiryServices,
} from "@/lib/inquiry-display";

describe("inquiryItemSize", () => {
  it("medidas del catálogo y a la medida", () => {
    expect(inquiryItemSize({ widthCm: 60, heightCm: 80, customShape: null })).toBe("60 × 80 cm");
    expect(inquiryItemSize({ widthCm: 90, heightCm: 90, customShape: "ROUND" })).toBe("Ø 90 cm");
    expect(inquiryItemShape({ widthCm: 90, heightCm: 90, customShape: "ROUND" })).toBe("Redondo");
    expect(inquiryItemSize({ widthCm: null, heightCm: null, customShape: null })).toBeNull();
  });
});

describe("inquiryServices", () => {
  it("frase con mayúscula inicial", () => {
    expect(inquiryServices({ needsShipping: true, needsInstallation: true })).toBe(
      "Envío e instalación",
    );
    expect(inquiryServices({ needsShipping: false, needsInstallation: true })).toBe("Instalación");
    expect(inquiryServices({ needsShipping: false, needsInstallation: false })).toBeNull();
  });
});

describe("inquiriesHref", () => {
  it("conserva filtros, omite valores por defecto y aplica cambios", () => {
    const current = { q: "", estado: "NEW", tipo: "todos", periodo: "7d", pagina: 2 };
    expect(inquiriesHref(current, { consulta: "abc" })).toBe(
      "/admin/consultas?estado=NEW&periodo=7d&pagina=2&consulta=abc",
    );
    expect(inquiriesHref(current, { estado: "todas", pagina: 1, periodo: null })).toBe(
      "/admin/consultas",
    );
  });
});
