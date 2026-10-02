"use client";

import { SearchIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "activos", label: "Activos" },
  { value: "PUBLISHED", label: "Publicados" },
  { value: "DRAFT", label: "Borradores" },
  { value: "ARCHIVED", label: "Archivados" },
] as const;

type Counts = Record<(typeof STATUS_TABS)[number]["value"], number>;

const ALL_CATEGORIES = "todas";

export function ProductFilters({
  categories,
  counts,
}: {
  categories: Array<{ id: string; name: string }>;
  counts: Counts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Controlado: la URL cambia mientras se escribe y un defaultValue cambiante confunde a Base UI.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const currentStatus = searchParams.get("estado") ?? "activos";
  const categoryItems = {
    [ALL_CATEGORIES]: "Todas las categorías",
    ...Object.fromEntries(categories.map((category) => [category.id, category.name])),
  };

  /** Cambia un filtro en la URL y vuelve a la página 1. */
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("pagina");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function hrefForStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "activos") params.delete("estado");
    else params.set("estado", status);
    params.delete("pagina");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar por nombre o referencia"
            placeholder="Buscar por nombre o referencia…"
            className="pl-8"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              const value = event.target.value.trim();
              clearTimeout(debounce.current);
              debounce.current = setTimeout(() => setParam("q", value || null), 300);
            }}
          />
        </div>
        <Select
          items={categoryItems}
          value={searchParams.get("categoria") ?? ALL_CATEGORIES}
          onValueChange={(value) =>
            setParam("categoria", value && value !== ALL_CATEGORIES ? String(value) : null)
          }
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav aria-label="Estado" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {STATUS_TABS.map((tab) => {
          const active = currentStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={hrefForStatus(tab.value)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
              <span className="tabular-nums opacity-70">{counts[tab.value]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
