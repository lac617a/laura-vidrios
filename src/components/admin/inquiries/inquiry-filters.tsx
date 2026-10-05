"use client";

import { HashIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, INQUIRY_TYPE_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const ALL = "__todas";

const TYPE_ITEMS = { todos: "Todos los tipos", ...INQUIRY_TYPE_LABELS };
const PERIOD_ITEMS = {
  todo: "Cualquier fecha",
  hoy: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
};

/**
 * Filtros de consultas en la URL. Arriba, la búsqueda por el código que llega en el mensaje de
 * WhatsApp (PRD RF-A13): acepta "#k7m2qx", "K7M2QX" o el nombre o teléfono del cliente.
 */
export function InquiryFilters({
  options,
  counts,
}: {
  options: { cities: string[]; products: Array<{ id: string; label: string }> };
  counts: Record<"todas" | InquiryStatus, number | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function setParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("pagina");
    params.delete("consulta");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  function hrefForStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "todas") params.delete("estado");
    else params.set("estado", status);
    params.delete("pagina");
    params.delete("consulta");
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  const currentStatus = searchParams.get("estado") ?? "todas";
  const cityItems = {
    [ALL]: "Todas las ciudades",
    ...Object.fromEntries(options.cities.map((city) => [city, city])),
  };
  const productItems = {
    [ALL]: "Todos los productos",
    ...Object.fromEntries(options.products.map((product) => [product.id, product.label])),
  };

  return (
    <div className="mb-4 space-y-3">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          clearTimeout(debounce.current);
          setParams({ q: query.trim() || null });
        }}
        className="relative"
      >
        <HashIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Buscar por código, nombre o teléfono"
          placeholder="Código del mensaje (ej. K7M2QX), nombre o teléfono"
          autoComplete="off"
          className="h-12 pr-10 pl-10 font-mono text-base tracking-wide placeholder:font-sans placeholder:tracking-normal"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            const value = event.target.value.trim();
            clearTimeout(debounce.current);
            debounce.current = setTimeout(() => setParams({ q: value || null }), 400);
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery("");
              setParams({ q: null });
            }}
            className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        )}
      </form>

      <nav aria-label="Estado" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {(["todas", ...INQUIRY_STATUSES] as const).map((status) => {
          const active = currentStatus === status;
          return (
            <Link
              key={status}
              href={hrefForStatus(status)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {status === "todas" ? "Todas" : INQUIRY_STATUS_LABELS[status]}
              <span className="text-xs tabular-nums">{counts[status] ?? 0}</span>
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <FilterSelect
          label="Tipo"
          items={TYPE_ITEMS}
          value={searchParams.get("tipo") ?? "todos"}
          onChange={(value) => setParams({ tipo: value === "todos" ? null : value })}
        />
        <FilterSelect
          label="Fecha"
          items={PERIOD_ITEMS}
          value={searchParams.get("periodo") ?? "todo"}
          onChange={(value) => setParams({ periodo: value === "todo" ? null : value })}
        />
        <FilterSelect
          label="Ciudad"
          items={cityItems}
          value={searchParams.get("ciudad") ?? ALL}
          onChange={(value) => setParams({ ciudad: value === ALL ? null : value })}
        />
        <FilterSelect
          label="Producto"
          items={productItems}
          value={searchParams.get("producto") ?? ALL}
          onChange={(value) => setParams({ producto: value === ALL ? null : value })}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(String(next ?? ""))}>
      <SelectTrigger className="w-full" aria-label={`Filtrar por ${label.toLowerCase()}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, itemLabel]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {itemLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
