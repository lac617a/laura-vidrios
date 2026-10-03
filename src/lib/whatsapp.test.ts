import { describe, expect, it } from "vitest";

import {
  buildProductInquiryMessage,
  buildWhatsappUrl,
  formatWhatsappNumber,
  normalizeWhatsappNumber,
} from "@/lib/whatsapp";

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

describe("buildProductInquiryMessage", () => {
  const base = {
    productName: "Espejo Redondo Luna LED",
    reference: "ESP-0012-60x60",
    sizeLabel: "Ø 60 cm",
    priceLabel: "$ 850.000",
    url: "https://espejos.co/espejos/luna-led?medida=60x60",
    needsShipping: false,
    needsInstallation: false,
    city: "",
  };

  it("arma el mensaje del PRD con servicios, ciudad y código", () => {
    expect(
      buildProductInquiryMessage({
        ...base,
        needsShipping: true,
        needsInstallation: true,
        city: " Medellín ",
        code: "K7M2QX",
      }),
    ).toBe(
      [
        "Hola, vi este espejo en la web y me interesa:",
        "",
        "Espejo Redondo Luna LED",
        "Ref: ESP-0012-60x60",
        "Medida: Ø 60 cm",
        "Precio: $ 850.000",
        "https://espejos.co/espejos/luna-led?medida=60x60",
        "",
        "Necesito: envío e instalación",
        "Ciudad: Medellín",
        "",
        "Código de consulta: #K7M2QX",
        "¿Está disponible?",
      ].join("\n"),
    );
  });

  it("omite precio, servicios y ciudad cuando no hay", () => {
    const message = buildProductInquiryMessage({ ...base, priceLabel: null });
    expect(message).not.toContain("Precio");
    expect(message).not.toContain("Necesito");
    expect(message).not.toContain("Ciudad");
    expect(message.endsWith("\n\n¿Está disponible?")).toBe(true);
  });

  it("un solo servicio", () => {
    expect(buildProductInquiryMessage({ ...base, needsInstallation: true })).toContain(
      "Necesito: instalación",
    );
  });
});
