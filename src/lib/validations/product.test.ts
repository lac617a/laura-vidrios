import { describe, expect, it } from "vitest";

import {
  normalizeVariants,
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";

function product(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    name: "Espejo Luna",
    slug: "",
    reference: "",
    categoryId: "cat_1",
    shape: "RECTANGULAR",
    description: "",
    frameMaterial: "",
    frameColor: "",
    style: "",
    hasLed: false,
    isFeatured: false,
    showPrice: true,
    allowCustomSize: true,
    status: "DRAFT",
    variants: [
      { widthCm: 60, heightCm: 80, price: 260000, availability: "IN_STOCK", isDefault: true },
    ],
    ...overrides,
  };
}

const messages = (input: unknown) =>
  productFormSchema.safeParse(input).error?.issues.map((issue) => issue.message) ?? [];

describe("productFormSchema", () => {
  it("acepta un producto válido y normaliza referencia y slug", () => {
    const parsed = productFormSchema.parse(product({ reference: " esp-0012 ", slug: "Luna-LED" }));
    expect(parsed.reference).toBe("ESP-0012");
    expect(parsed.slug).toBe("luna-led");
  });

  it("no publica sin medidas, pero sí guarda el borrador", () => {
    expect(messages(product({ status: "PUBLISHED", variants: [] }))).toContain(
      "Agrega al menos una medida para publicar.",
    );
    expect(productFormSchema.safeParse(product({ variants: [] })).success).toBe(true);
  });

  it("rechaza medidas repetidas", () => {
    const variant = {
      widthCm: 60,
      heightCm: 80,
      price: null,
      availability: "IN_STOCK",
      isDefault: false,
    } as const;
    expect(messages(product({ variants: [variant, variant] }))).toContain(
      "Ya agregaste la medida 60 × 80 cm.",
    );
  });

  it("en redondos compara por diámetro aunque el alto venga distinto", () => {
    const variants = [
      { widthCm: 60, heightCm: 60, price: null, availability: "IN_STOCK", isDefault: true },
      { widthCm: 60, heightCm: 99, price: null, availability: "IN_STOCK", isDefault: false },
    ] as const;
    expect(messages(product({ shape: "ROUND", variants: [...variants] }))).toContain(
      "Ya agregaste la medida Ø 60 cm.",
    );
  });

  it("exige medidas enteras y positivas", () => {
    const bad = {
      widthCm: Number.NaN,
      heightCm: 0,
      price: -1,
      availability: "IN_STOCK",
      isDefault: true,
    } as const;
    const result = messages(product({ variants: [bad] }));
    expect(result).toContain("Escribe la medida.");
    expect(result).toContain("Debe ser mayor que 0.");
    expect(result).toContain("El precio no puede ser negativo.");
  });

  it("valida el formato de slug y referencia", () => {
    expect(messages(product({ slug: "con espacios" }))).toContain(
      "Solo minúsculas, números y guiones (ej. espejo-redondo-luna).",
    );
    expect(messages(product({ reference: "ESP 12" }))).toContain(
      "Solo letras, números y guiones (ej. ESP-0012).",
    );
  });
});

describe("normalizeVariants", () => {
  it("deja exactamente una medida por defecto (la primera si no hay)", () => {
    const variants = [
      { widthCm: 50, heightCm: 70, price: null, availability: "IN_STOCK", isDefault: false },
      { widthCm: 60, heightCm: 80, price: null, availability: "IN_STOCK", isDefault: false },
    ] as const;
    expect(normalizeVariants("RECTANGULAR", [...variants]).map((v) => v.isDefault)).toEqual([
      true,
      false,
    ]);
  });

  it("si hay varias por defecto, conserva la primera", () => {
    const variants = [
      { widthCm: 50, heightCm: 70, price: null, availability: "IN_STOCK", isDefault: false },
      { widthCm: 60, heightCm: 80, price: null, availability: "IN_STOCK", isDefault: true },
      { widthCm: 70, heightCm: 90, price: null, availability: "IN_STOCK", isDefault: true },
    ] as const;
    expect(normalizeVariants("RECTANGULAR", [...variants]).map((v) => v.isDefault)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("en redondos y cuadrados iguala el alto al ancho", () => {
    const [round] = normalizeVariants("ROUND", [
      { widthCm: 60, heightCm: 1, price: null, availability: "IN_STOCK", isDefault: true },
    ]);
    expect(round).toMatchObject({ widthCm: 60, heightCm: 60 });
  });
});
