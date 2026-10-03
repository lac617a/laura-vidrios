import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Opción tipo tarjeta: un radio oculto dentro de la etiqueta (medidas, marcos, formas…). */
export function RadioCard({
  name,
  checked,
  onSelect,
  label,
  detail,
  muted = false,
  icon,
  className,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  detail?: string;
  muted?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
        muted && "opacity-60",
        className,
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </span>
      {detail && <span className="text-xs text-muted-foreground tabular-nums">{detail}</span>}
    </label>
  );
}
