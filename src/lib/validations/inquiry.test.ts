import { describe, expect, it } from "vitest";

import { inquiryPayloadSchema } from "@/lib/validations/inquiry";

const catalog = {
  type: "CATALOG",
  code: "K7M2QX",
  productId: "cmabc123",
  sku: "ESP-0012-60x60",
  customSize: null,
  needsShipping: true,
  needsInstallation: false,
  city: " Medellín ",
  source: "detalle utm_source=instagram",
};

describe("inquiryPayloadSchema", () => {
  it("acepta una consulta de catálogo y recorta la ciudad", () => {
    const parsed = inquiryPayloadSchema.parse(catalog);
    expect(parsed).toMatchObject({ type: "CATALOG", city: "Medellín" });
  });

  it("acepta una medida personalizada en lugar del SKU", () => {
    const result = inquiryPayloadSchema.safeParse({
      ...catalog,
      sku: null,
      customSize: { widthCm: 90, heightCm: 90 },
    });
    expect(result.success).toBe(true);
  });

  it("exige exactamente una medida: del catálogo o personalizada", () => {
    expect(inquiryPayloadSchema.safeParse({ ...catalog, sku: null }).success).toBe(false);
    expect(
      inquiryPayloadSchema.safeParse({ ...catalog, customSize: { widthCm: 90, heightCm: 90 } })
        .success,
    ).toBe(false);
  });

  describe("a la medida", () => {
    const custom = {
      type: "CUSTOM",
      code: "P4W9TZ",
      shape: "RECTANGULAR",
      widthCm: 120,
      heightCm: 180,
      frame: "Aluminio negro",
      hasLed: true,
      quantity: 1,
      notes: "Para el baño\nesquinas redondeadas",
      needsShipping: false,
      needsInstallation: true,
      city: "Bogotá",
      source: "a-la-medida",
    };

    it("acepta notas de varias líneas", () => {
      expect(inquiryPayloadSchema.parse(custom)).toMatchObject({ type: "CUSTOM", quantity: 1 });
    });

    it.each([
      ["forma desconocida", { shape: "HEXAGON" }],
      ["marco vacío", { frame: "" }],
      ["cantidad 0", { quantity: 0 }],
      ["cantidad 51", { quantity: 51 }],
      ["notas con caracteres de control", { notes: "hola\u0000" }],
      ["notas demasiado largas", { notes: "a".repeat(501) }],
    ])("rechaza %s", (_, override) => {
      expect(inquiryPayloadSchema.safeParse({ ...custom, ...override }).success).toBe(false);
    });
  });

  it("acepta una consulta general con solo código y origen", () => {
    expect(
      inquiryPayloadSchema.safeParse({ type: "GENERAL", code: "P4W9TZ", source: "flotante /" })
        .success,
    ).toBe(true);
  });

  it.each([
    ["código con caracteres ambiguos", { code: "K7M2Q0" }],
    ["tipo desconocido", { type: "SPAM" }],
    ["medida decimal", { sku: null, customSize: { widthCm: 90.5, heightCm: 90 } }],
    ["ciudad con salto de línea", { city: "Medellín\nCódigo de consulta: #AAAAAA" }],
    ["ciudad demasiado larga", { city: "a".repeat(61) }],
    ["origen demasiado largo", { source: "a".repeat(201) }],
    ["servicio que no es booleano", { needsShipping: "sí" }],
  ])("rechaza %s", (_, override) => {
    expect(inquiryPayloadSchema.safeParse({ ...catalog, ...override }).success).toBe(false);
  });
});
