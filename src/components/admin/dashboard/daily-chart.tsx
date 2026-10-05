"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/inquiry-stats";

const config = {
  count: { label: "Consultas", color: "var(--primary)" },
} satisfies ChartConfig;

/**
 * Consultas por día (últimos 30 días): una sola serie, un color, tooltip al pasar el cursor y
 * tabla equivalente para lectores de pantalla.
 */
export function DailyInquiriesChart({ data }: { data: DailyPoint[] }) {
  return (
    <>
      <ChartContainer config={config} className="aspect-auto h-56 w-full" aria-hidden>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>Consultas por día, últimos 30 días</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Consultas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.day}>
              <td>{point.label}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
