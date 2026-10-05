// Cálculos del dashboard de consultas (puros, con tests).

import { bogotaDayKey, formatDayKey, lastDayKeys } from "@/lib/dates";

export type DailyPoint = { day: string; label: string; count: number };

/** Consultas por día de Colombia en los últimos `days` días, incluidos los días sin consultas. */
export function dailySeries(dates: Date[], now: Date, days: number): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = bogotaDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return lastDayKeys(now, days).map((day) => ({
    day,
    label: formatDayKey(day),
    count: counts.get(day) ?? 0,
  }));
}

/** Tasa de cierre (PRD RF-A03): vendidas / total. null si no hay consultas. */
export function closeRate(won: number, total: number): number | null {
  return total > 0 ? won / total : null;
}

/** 0.256 → "26 %" */
export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)} %`;
}
