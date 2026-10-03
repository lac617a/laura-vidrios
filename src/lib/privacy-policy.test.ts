import { describe, expect, it } from "vitest";

import { defaultPrivacyPolicy } from "@/lib/privacy-policy";
import { textBlocks } from "@/lib/text";

describe("defaultPrivacyPolicy", () => {
  it("usa los datos del negocio y se arma en secciones con listas", () => {
    const text = defaultPrivacyPolicy({
      businessName: "Espejos Demo",
      whatsappNumber: "573001234567",
      address: "Calle 1 # 2-3, Bogotá",
    });
    expect(text).toContain("Espejos Demo, con domicilio en Calle 1 # 2-3, Bogotá, es responsable");
    expect(text).toContain("por WhatsApp al +57 300 123 4567");

    const blocks = textBlocks(text);
    expect(blocks.filter((block) => block.type === "heading").map((block) => block.text)).toEqual([
      "Responsable del tratamiento",
      "Qué datos tratamos",
      "Para qué los usamos",
      "Tus derechos",
      "Cómo ejercerlos",
      "Autorización",
      "Vigencia",
    ]);
    expect(blocks.some((block) => block.type === "list")).toBe(true);
  });

  it("sin dirección ni WhatsApp sigue siendo legible", () => {
    const text = defaultPrivacyPolicy({
      businessName: "Espejos",
      whatsappNumber: "",
      address: null,
    });
    expect(text).toContain("Espejos es responsable");
    expect(text).toContain("por los canales de contacto de este sitio");
  });
});
