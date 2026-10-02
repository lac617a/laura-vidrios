import { describe, expect, it } from "vitest";

import {
  parseList,
  settingsFormSchema,
  toSettingsData,
  type SettingsFormValues,
} from "@/lib/validations/settings";

const valid: SettingsFormValues = {
  businessName: "Espejos Demo",
  address: "",
  openingHours: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  whatsappNumber: "300 123 4567",
  referencePrefix: "esp",
  shippingInfo: "",
  installationInfo: "",
  coverageAreas: "Bogotá\nMedellín, Bogotá\n\n",
  customMinCm: 20,
  customMaxCm: 250,
  customFrameOptions: "",
  privacyPolicy: "",
};

describe("parseList", () => {
  it("separa por línea o coma, recorta y quita duplicados", () => {
    expect(parseList(" Bogotá \nMedellín, Bogotá\n\n Cali ")).toEqual([
      "Bogotá",
      "Medellín",
      "Cali",
    ]);
    expect(parseList("")).toEqual([]);
  });
});

describe("settingsFormSchema", () => {
  it("normaliza y convierte a datos de BD", () => {
    const data = toSettingsData(settingsFormSchema.parse(valid));
    expect(data.whatsappNumber).toBe("573001234567");
    expect(data.referencePrefix).toBe("ESP");
    expect(data.coverageAreas).toEqual(["Bogotá", "Medellín"]);
    expect(data.address).toBeNull();
  });

  it("rechaza un WhatsApp que no es celular colombiano", () => {
    const result = settingsFormSchema.safeParse({ ...valid, whatsappNumber: "601 123 4567" });
    expect(result.success).toBe(false);
  });

  it("exige mínimo menor que máximo", () => {
    const result = settingsFormSchema.safeParse({ ...valid, customMinCm: 300, customMaxCm: 250 });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["customMaxCm"],
      message: "Debe ser mayor que la medida mínima.",
    });
  });

  it("solo acepta enlaces https en redes", () => {
    expect(
      settingsFormSchema.safeParse({ ...valid, instagramUrl: "instagram.com/x" }).success,
    ).toBe(false);
    expect(
      settingsFormSchema.safeParse({ ...valid, instagramUrl: "https://instagram.com/x" }).success,
    ).toBe(true);
  });
});
