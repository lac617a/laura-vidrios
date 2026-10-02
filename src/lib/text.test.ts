import { describe, expect, it } from "vitest";

import { normalizeSearchText, slugify } from "@/lib/text";

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
