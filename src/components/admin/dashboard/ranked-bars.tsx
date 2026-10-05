import Link from "next/link";

import { cn } from "@/lib/utils";

export type RankedItem = {
  key: string;
  label: string;
  detail?: string;
  value: number;
  href?: string;
  /** Color de la barra (por defecto, el primario). */
  barClassName?: string;
};

/** Lista ordenada con barras proporcionales: etiqueta y cifra en texto, la barra solo acompaña. */
export function RankedBars({ items, empty }: { items: RankedItem[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (items.every((item) => item.value === 0)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                {item.label}
                {item.detail && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{item.detail}</span>
                )}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{item.value}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-primary", item.barClassName)}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&:hover_span:first-child]:underline"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
