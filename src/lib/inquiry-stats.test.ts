import { describe, expect, it } from "vitest";

import { closeRate, dailySeries, formatPercent } from "@/lib/inquiry-stats";

describe("dailySeries", () => {
  it("agrupa por día de Colombia y rellena los días vacíos", () => {
    const now = new Date("2026-10-03T15:00:00Z");
    const series = dailySeries(
      [
        new Date("2026-10-03T14:00:00Z"),
        new Date("2026-10-03T04:59:00Z"), // 2 oct 23:59 en Bogotá
        new Date("2026-10-02T12:00:00Z"),
        new Date("2026-09-01T12:00:00Z"), // fuera del rango
      ],
      now,
      3,
    );
    expect(series.map(({ day, count }) => [day, count])).toEqual([
      ["2026-10-01", 0],
      ["2026-10-02", 2],
      ["2026-10-03", 1],
    ]);
    expect(series[2].label).toMatch(/^3 oct/);
  });
});

describe("closeRate", () => {
  it("vendidas sobre total", () => {
    expect(closeRate(3, 12)).toBe(0.25);
    expect(closeRate(0, 0)).toBeNull();
    expect(formatPercent(closeRate(1, 3))).toBe("33 %");
    expect(formatPercent(null)).toBe("—");
  });
});
