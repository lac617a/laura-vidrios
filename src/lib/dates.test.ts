import { describe, expect, it } from "vitest";

import {
  bogotaDayKey,
  formatDayKey,
  lastDayKeys,
  startOfDayBogota,
  startOfLastDays,
} from "@/lib/dates";

describe("fechas en hora de Colombia", () => {
  it("el día cambia a medianoche de Bogotá (05:00 UTC), no de UTC", () => {
    // 3 oct 23:30 en Bogotá = 4 oct 04:30 UTC: sigue siendo 3 de octubre.
    const late = new Date("2026-10-04T04:30:00Z");
    expect(bogotaDayKey(late)).toBe("2026-10-03");
    expect(startOfDayBogota(late).toISOString()).toBe("2026-10-03T05:00:00.000Z");
    // 4 oct 00:10 en Bogotá = 4 oct 05:10 UTC.
    expect(bogotaDayKey(new Date("2026-10-04T05:10:00Z"))).toBe("2026-10-04");
  });

  it("últimos N días cuentan hoy", () => {
    const now = new Date("2026-10-03T15:00:00Z");
    expect(startOfLastDays(now, 1).toISOString()).toBe("2026-10-03T05:00:00.000Z");
    expect(startOfLastDays(now, 7).toISOString()).toBe("2026-09-27T05:00:00.000Z");
    expect(lastDayKeys(now, 3)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(lastDayKeys(now, 30)).toHaveLength(30);
  });

  it("formatea el día corto", () => {
    expect(formatDayKey("2026-10-03")).toMatch(/^3 oct/);
  });
});
