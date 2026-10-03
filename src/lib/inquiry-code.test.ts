import { describe, expect, it } from "vitest";

import {
  generateInquiryCode,
  INQUIRY_CODE_ALPHABET,
  isInquiryCode,
  normalizeInquiryCode,
} from "@/lib/inquiry-code";

describe("generateInquiryCode", () => {
  it("6 caracteres del alfabeto sin ambiguos", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateInquiryCode();
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
      expect(code).not.toMatch(/[01IOL]/);
      expect(isInquiryCode(code)).toBe(true);
    }
  });

  it("el alfabeto no tiene caracteres que se confunden", () => {
    expect(INQUIRY_CODE_ALPHABET).toHaveLength(31);
    for (const ambiguous of "01IOL") expect(INQUIRY_CODE_ALPHABET).not.toContain(ambiguous);
  });

  it("descarta los bytes que sesgarían la distribución", () => {
    // 248 en adelante se descartan (256 no es múltiplo de 31); 0 → "A", 31 → "A", 30 → "9".
    const bytes = [255, 248, 0, 31, 30, 250, 1, 2, 3];
    const code = generateInquiryCode((buffer) => {
      buffer.fill(0);
      buffer.set(bytes.slice(0, buffer.length));
      return buffer;
    });
    expect(code).toBe("AA9BCD");
  });

  it("usa todo el alfabeto de forma pareja", () => {
    // 186.000 caracteres → ~6.000 por símbolo (σ ≈ 77). Un margen de ±15 % detecta sesgos sin
    // fallar por azar. (No se prueba unicidad: con 31⁶ combinaciones los choques son esperables
    // en tandas grandes; el servidor los resuelve con sufijo.)
    const counts = new Map<string, number>();
    for (let i = 0; i < 31_000; i++) {
      for (const char of generateInquiryCode()) counts.set(char, (counts.get(char) ?? 0) + 1);
    }
    expect(counts.size).toBe(31);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(6000 * 0.85);
      expect(count).toBeLessThan(6000 * 1.15);
    }
  });
});

describe("isInquiryCode", () => {
  it.each(["", "K7M2Q", "K7M2QXX", "k7m2qx", "K7M2Q0", "K7M2QI", "K7M2-X", "#K7M2QX"])(
    "rechaza %j",
    (value) => {
      expect(isInquiryCode(value)).toBe(false);
    },
  );
});

describe("normalizeInquiryCode", () => {
  it("acepta lo que la dueña copia del chat", () => {
    expect(normalizeInquiryCode(" #k7m2qx ")).toBe("K7M2QX");
  });
});
