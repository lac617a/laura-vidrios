// Fechas en hora de Colombia (America/Bogota, UTC−5 todo el año, sin horario de verano).
// Puro: el servidor (en UTC) y el navegador calculan los mismos días.

export const TIME_ZONE = "America/Bogota";
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Medianoche de Colombia del día de `date`, como instante UTC. */
export function startOfDayBogota(date: Date): Date {
  const local = new Date(date.getTime() - OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET_MS);
}

/** Inicio del período "últimos N días" contando hoy (N = 1 es solo hoy). */
export function startOfLastDays(now: Date, days: number): Date {
  return new Date(startOfDayBogota(now).getTime() - (days - 1) * DAY_MS);
}

/** "2026-10-03": día en Colombia, para agrupar. */
export function bogotaDayKey(date: Date): string {
  return new Date(date.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

/** Los últimos N días (del más viejo a hoy) como claves "YYYY-MM-DD". */
export function lastDayKeys(now: Date, days: number): string[] {
  const start = startOfLastDays(now, days).getTime();
  return Array.from({ length: days }, (_, index) => bogotaDayKey(new Date(start + index * DAY_MS)));
}

const dateTime = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dayMonth = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

/** "3 oct, 2:15 p. m." en hora de Colombia. */
export function formatDateTime(date: Date): string {
  return dateTime.format(date);
}

/** "2026-10-03" → "3 oct" (compacto para ejes de gráficas; es-CO diría "3 de oct"). */
export function formatDayKey(key: string): string {
  const parts = dayMonth.formatToParts(new Date(`${key}T00:00:00Z`));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month").replace(/\.$/, "")}`;
}
