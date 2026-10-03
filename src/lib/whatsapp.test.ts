import { describe, expect, it } from "vitest";

import {
  buildCustomInquiryMessage,
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

describe("buildCustomInquiryMessage", () => {
  const base = {
    shapeLabel: "Rectangular",
    sizeLabel: "120 × 180 cm",
    frame: "Aluminio negro",
    hasLed: true,
    quantity: 1,
    notes: "Para pared de baño, esquinas redondeadas",
    needsShipping: false,
    needsInstallation: true,
    city: "Bogotá",
    code: "P4W9TZ",
  };

  it("arma el mensaje del PRD (segundo ejemplo)", () => {
    expect(buildCustomInquiryMessage(base)).toBe(
      [
        "Hola, quiero cotizar un espejo a la medida:",
        "",
        "Forma: Rectangular",
        "Medida: 120 × 180 cm",
        "Marco: Aluminio negro",
        "Luz LED: Sí",
        "Cantidad: 1",
        "Notas: Para pared de baño, esquinas redondeadas",
        "",
        "Necesito: instalación",
        "Ciudad: Bogotá",
        "",
        "Código de consulta: #P4W9TZ",
      ].join("\n"),
    );
  });

  it("sin notas, servicios ni código", () => {
    const message = buildCustomInquiryMessage({
      ...base,
      hasLed: false,
      notes: "  ",
      needsInstallation: false,
      city: "",
      code: null,
    });
    expect(message).toBe(
      [
        "Hola, quiero cotizar un espejo a la medida:",
        "",
        "Forma: Rectangular",
        "Medida: 120 × 180 cm",
        "Marco: Aluminio negro",
        "Luz LED: No",
        "Cantidad: 1",
      ].join("\n"),
    );
  });

  it("notas de varias líneas y el máximo permitido caben en la URL", () => {
    const url = buildWhatsappUrl(
      "573001234567",
      buildCustomInquiryMessage({
        ...base,
        shapeLabel: "Orgánico",
        sizeLabel: "250 × 250 cm",
        frame: "Á".repeat(80),
        quantity: 50,
        notes: `${"Ñ".repeat(250)}\n${"é".repeat(249)}`,
        needsShipping: true,
        city: "Á".repeat(60),
      }),
    );
    expect(new URL(url).searchParams.get("text")).toContain(`Notas: ${"Ñ".repeat(250)}\n`);
    // Peor caso (todo con tildes, que se codifican en 6 caracteres): ~4.200. Con 500 caracteres
    // de notas sin tildes, la URL queda por debajo de 1.000.
    expect(url.length).toBeLessThan(4500);
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
