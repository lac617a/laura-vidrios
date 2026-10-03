import { describe, expect, it } from "vitest";

import {
  customSize,
  customSizeLabel,
  EMPTY_ORDER,
  firstIncompleteStep,
  FRAME_RECOMMEND,
  framePreview,
  normalizeNotes,
  parseDraft,
  stepError,
  SUMMARY_STEP,
  type CustomOrder,
} from "@/lib/custom-order";

const limits = { minCm: 20, maxCm: 250 };
const complete: CustomOrder = {
  ...EMPTY_ORDER,
  shape: "RECTANGULAR",
  width: "120",
  height: "180",
  frame: "Aluminio negro",
  hasLed: true,
};

describe("customSize", () => {
  it("rectangular: ancho × alto", () => {
    expect(customSize(complete)).toEqual({ widthCm: 120, heightCm: 180 });
    expect(customSizeLabel(complete)).toBe("120 × 180 cm");
  });

  it("redondo y cuadrado: una sola medida (el alto escrito antes se ignora)", () => {
    const round = { ...complete, shape: "ROUND" as const, width: "90", height: "180" };
    expect(customSize(round)).toEqual({ widthCm: 90, heightCm: 90 });
    expect(customSizeLabel(round)).toBe("Ø 90 cm");
    expect(customSizeLabel({ ...round, shape: "SQUARE" })).toBe("90 × 90 cm");
  });

  it("incompleta o sin forma: null", () => {
    expect(customSize({ ...complete, height: "" })).toBeNull();
    expect(customSize({ ...complete, shape: null })).toBeNull();
  });
});

describe("stepError", () => {
  it("cada paso pide lo suyo", () => {
    expect(stepError(0, EMPTY_ORDER, limits)).toMatch(/forma/);
    expect(stepError(1, { ...EMPTY_ORDER, shape: "ROUND" }, limits)).toBe("Escribe la medida.");
    expect(stepError(1, { ...EMPTY_ORDER, shape: "OVAL", width: "50" }, limits)).toBe(
      "Escribe el ancho y el alto.",
    );
    expect(stepError(2, EMPTY_ORDER, limits)).toContain(FRAME_RECOMMEND);
    expect(stepError(3, EMPTY_ORDER, limits)).toMatch(/LED/);
    expect(stepError(4, EMPTY_ORDER, limits)).toBeNull();
  });

  it.each([
    ["300", "180"],
    ["120", "19"],
    ["0", "100"],
  ])("medida fuera de rango (%s × %s) explica el rango", (width, height) => {
    expect(stepError(1, { ...complete, width, height }, limits)).toBe(
      "Las medidas van de 20 a 250 cm, en números enteros.",
    );
  });

  it("los límites son inclusivos", () => {
    expect(stepError(1, { ...complete, width: "20", height: "250" }, limits)).toBeNull();
  });

  it("cantidad entre 1 y 50", () => {
    expect(stepError(3, { ...complete, quantity: 0 }, limits)).toMatch(/1 a 50/);
    expect(stepError(3, { ...complete, quantity: 51 }, limits)).toMatch(/1 a 50/);
    expect(stepError(3, { ...complete, quantity: 50 }, limits)).toBeNull();
  });
});

describe("firstIncompleteStep", () => {
  it("lleva al primer paso pendiente o al resumen", () => {
    expect(firstIncompleteStep(EMPTY_ORDER, limits)).toBe(0);
    expect(firstIncompleteStep({ ...complete, frame: null }, limits)).toBe(2);
    expect(firstIncompleteStep(complete, limits)).toBe(SUMMARY_STEP);
  });
});

describe("normalizeNotes", () => {
  it("limpia saltos de Windows, controles y líneas vacías de más", () => {
    expect(normalizeNotes("  Baño\r\n\r\n\r\n\r\nesquinas\u0007 redondas  \t\n ")).toBe(
      "Baño\n\nesquinas redondas",
    );
  });

  it("corta en 500 caracteres", () => {
    expect(normalizeNotes("a".repeat(600))).toHaveLength(500);
  });
});

describe("parseDraft", () => {
  const options = { frameOptions: ["Aluminio negro", "Biselado"], limits, now: 1_000_000_000 };
  const saved = (
    order: Partial<CustomOrder> | unknown,
    step = 5,
    savedAt = options.now - 1000,
  ) => ({
    savedAt,
    step,
    order,
  });

  it("recupera un borrador completo en el paso guardado", () => {
    expect(parseDraft(saved(complete), options)).toEqual({ step: 5, order: complete });
  });

  it("no deja saltar pasos incompletos", () => {
    expect(parseDraft(saved({ ...complete, hasLed: null }), options)?.step).toBe(3);
  });

  it("descarta el marco que ya no se ofrece, pero conserva «que me recomienden»", () => {
    expect(
      parseDraft(saved({ ...complete, frame: "Oro macizo" }), options)?.order.frame,
    ).toBeNull();
    expect(parseDraft(saved({ ...complete, frame: FRAME_RECOMMEND }), options)?.order.frame).toBe(
      FRAME_RECOMMEND,
    );
  });

  it("limpia valores con tipos o contenido inesperado", () => {
    const parsed = parseDraft(
      saved({ shape: "HEXAGON", width: "12a0", quantity: 999, hasLed: "sí", notes: 42 }),
      options,
    );
    expect(parsed).toEqual({
      step: 0,
      order: { ...EMPTY_ORDER, width: "120" },
    });
  });

  it("ignora borradores viejos (más de 30 días) o con otro formato", () => {
    expect(parseDraft(saved(complete, 5, options.now - 31 * 24 * 3600 * 1000), options)).toBeNull();
    expect(parseDraft("texto", options)).toBeNull();
    expect(parseDraft({ step: 2 }, options)).toBeNull();
  });
});

describe("framePreview", () => {
  it.each([
    ["Aluminio negro", "#24211e"],
    ["Aluminio dorado", "#b8913a"],
    ["Aluminio plateado", "#b4b8bd"],
    ["Madera natural", "#9a6b3f"],
    ["Marco de latón", "#b8913a"],
  ])("%s → %s", (frame, color) => {
    expect(framePreview(frame)).toEqual({ color, width: 6 });
  });

  it.each(["Sin marco", "Biselado", FRAME_RECOMMEND, null])("%s: sin marco visible", (frame) => {
    expect(framePreview(frame).width).toBe(0);
  });
});
