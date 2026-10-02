import { describe, expect, it } from "vitest";

import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from "@/lib/whatsapp";

describe("normalizeWhatsappNumber", () => {
  it.each([
    ["3001234567", "573001234567"],
    ["300 123 4567", "573001234567"],
    ["+57 300 123 4567", "573001234567"],
    ["57 300-123-4567", "573001234567"],
    ["573001234567", "573001234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWhatsappNumber(input)).toBe(expected);
  });

  it.each(["", "12345", "6011234567", "570000000000", "+1 300 123 4567", "30012345678"])(
    "rechaza %s",
    (input) => {
      expect(normalizeWhatsappNumber(input)).toBeNull();
    },
  );
});

describe("formatWhatsappNumber", () => {
  it("formatea para mostrar", () => {
    expect(formatWhatsappNumber("573001234567")).toBe("+57 300 123 4567");
  });
});

describe("buildWhatsappUrl", () => {
  it("codifica tildes, símbolos y saltos de línea", () => {
    const url = buildWhatsappUrl("573001234567", "Hola, ¿está disponible?\nØ 60 × 80 cm");
    expect(url).toBe(
      "https://wa.me/573001234567?text=Hola%2C%20%C2%BFest%C3%A1%20disponible%3F%0A%C3%98%2060%20%C3%97%2080%20cm",
    );
    expect(decodeURIComponent(new URL(url).searchParams.get("text")!)).toBe(
      "Hola, ¿está disponible?\nØ 60 × 80 cm",
    );
  });

  it("sin texto deja solo el número", () => {
    expect(buildWhatsappUrl("573001234567")).toBe("https://wa.me/573001234567");
  });
});
