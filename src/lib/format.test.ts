import { describe, expect, it } from "vitest";

import {
  formatCOP,
  formatMedida,
  formatPriceFrom,
  formatReference,
  formatSizeRange,
  formatThousands,
  parseDigits,
  variantSku,
} from "@/lib/format";

// Intl usa un espacio duro (U+00A0) entre "$" y el número.
const nbsp = (value: string) => value.replace(/ /g, " ");

describe("formatCOP", () => {
  it("usa punto de miles y sin decimales", () => {
    expect(nbsp(formatCOP(850000))).toBe("$ 850.000");
    expect(nbsp(formatCOP(1250000))).toBe("$ 1.250.000");
    expect(nbsp(formatCOP(0))).toBe("$ 0");
  });
});

describe("formatThousands / parseDigits", () => {
  it("formatea y vuelve a leer el mismo número", () => {
    expect(formatThousands(850000)).toBe("850.000");
    expect(parseDigits("850.000")).toBe(850000);
    expect(parseDigits("$ 1.250.000")).toBe(1250000);
  });

  it("devuelve null si no hay dígitos", () => {
    expect(parseDigits("")).toBeNull();
    expect(parseDigits("abc")).toBeNull();
  });
});

describe("formatMedida", () => {
  it("muestra ancho × alto", () => {
    expect(formatMedida(60, 80, "RECTANGULAR")).toBe("60 × 80 cm");
    expect(formatMedida(60, 60, "SQUARE")).toBe("60 × 60 cm");
  });

  it("muestra el diámetro en espejos redondos", () => {
    expect(formatMedida(60, 60, "ROUND")).toBe("Ø 60 cm");
  });
});

describe("formatSizeRange", () => {
  it("una sola medida", () => {
    expect(formatSizeRange([{ widthCm: 60, heightCm: 80 }])).toBe("60 × 80 cm");
  });

  it("rango de la más pequeña a la más grande", () => {
    const sizes = [
      { widthCm: 70, heightCm: 90 },
      { widthCm: 50, heightCm: 70 },
      { widthCm: 60, heightCm: 80 },
    ];
    expect(formatSizeRange(sizes)).toBe("50 × 70 a 70 × 90 cm");
    expect(
      formatSizeRange(
        [
          { widthCm: 50, heightCm: 50 },
          { widthCm: 70, heightCm: 70 },
        ],
        "ROUND",
      ),
    ).toBe("Ø 50 a Ø 70 cm");
  });

  it("sin medidas", () => {
    expect(formatSizeRange([])).toBe("Sin medidas");
  });
});

describe("formatPriceFrom", () => {
  it("precio único", () => {
    expect(nbsp(formatPriceFrom([520000], true))).toBe("$ 520.000");
    expect(nbsp(formatPriceFrom([520000, 520000], true))).toBe("$ 520.000");
  });

  it("desde el menor cuando hay varios", () => {
    expect(nbsp(formatPriceFrom([690000, 520000, null], true))).toBe("Desde $ 520.000");
  });

  it("a consultar si el precio está oculto o no hay precios", () => {
    expect(formatPriceFrom([520000], false)).toBe("A consultar");
    expect(formatPriceFrom([null], true)).toBe("A consultar");
  });
});

describe("referencias", () => {
  it("rellena con ceros a 4 dígitos", () => {
    expect(formatReference("ESP", 12)).toBe("ESP-0012");
    expect(formatReference("LV", 12345)).toBe("LV-12345");
  });

  it("arma el SKU de la variante", () => {
    expect(variantSku("ESP-0012", 60, 80)).toBe("ESP-0012-60x80");
  });
});
