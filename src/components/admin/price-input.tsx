"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatThousands, parseDigits } from "@/lib/format";

/** Precio en pesos con máscara de miles ("850.000"). El valor es un entero o null. */
export function PriceInput({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
      >
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn("pl-6 tabular-nums", className)}
        value={value === null ? "" : formatThousands(value)}
        onChange={(event) => onChange(parseDigits(event.target.value))}
        {...props}
      />
    </div>
  );
}
