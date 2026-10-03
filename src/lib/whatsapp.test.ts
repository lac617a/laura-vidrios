import { describe, expect, it } from "vitest";

import {
  buildGeneralInquiryMessage,
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
    code: null,
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

  it("sin código (antes de hidratar) no deja la línea vacía del código", () => {
    const message = buildProductInquiryMessage(base);
    expect(message).not.toContain("Código");
    expect(message).not.toContain("#");
  });

  it("medida personalizada con Ø y × sobrevive a la URL", () => {
    const message = buildProductInquiryMessage({
      ...base,
      reference: "ESP-0012",
      sizeLabel: "Ø 90 cm (medida personalizada)",
      priceLabel: null,
      code: "P4W9TZ",
    });
    const url = buildWhatsappUrl("573001234567", message);
    // Sin espacios, saltos, "#" ni "&" sueltos que corten el texto.
    expect(url.split("?text=")[1]).toMatch(/^[\w%.!~*'()-]+$/);
    expect(new URL(url).searchParams.get("text")).toBe(message);
    expect(message).toContain("Medida: Ø 90 cm (medida personalizada)\n");
    expect(message).toContain("Código de consulta: #P4W9TZ\n¿Está disponible?");
  });

  it("con los datos más largos permitidos, la URL de wa.me queda por debajo de 2.000 caracteres", () => {
    const longest = buildWhatsappUrl(
      "573001234567",
      buildProductInquiryMessage({
        productName: "Ñ".repeat(120), // nombre: máx. 120 (cada Ñ ocupa 6 caracteres codificada)
        reference: "ESPEJO-9999-1000x1000",
        sizeLabel: "1000 × 1000 cm (medida personalizada)",
        priceLabel: "$ 999.999.999",
        url: `https://catalogo-de-espejos.vercel.app/espejos/${"a".repeat(120)}?medida=1000x1000`,
        needsShipping: true,
        needsInstallation: true,
        city: "Á".repeat(60), // ciudad: máx. INQUIRY_CITY_MAX
        code: "K7M2QX",
      }),
    );
    expect(longest.length).toBeLessThan(2000);
  });
});

describe("buildGeneralInquiryMessage", () => {
  it("incluye el código cuando existe", () => {
    expect(buildGeneralInquiryMessage("K7M2QX")).toBe(
      "Hola, vengo de la página web y quiero más información.\n\nCódigo de consulta: #K7M2QX",
    );
  });

  it("sin código, solo el saludo", () => {
    expect(buildGeneralInquiryMessage(null)).toBe(
      "Hola, vengo de la página web y quiero más información.",
    );
  });
});
