"use client";

import { Loader2Icon, RulerIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useRef, useState, useTransition } from "react";

import { CatalogFiltersPanel, type FilterPatch } from "@/components/catalog/catalog-filters-panel";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SHAPE_LABELS } from "@/lib/catalog";
import {
  catalogParsers,
  catalogUrlKeys,
  countActiveFilters,
  SHAPE_SLUGS,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import type { CatalogCard, CatalogFacets } from "@/lib/catalog-public";
import { formatThousands } from "@/lib/format";
import { cn } from "@/lib/utils";

type Page = { total: number; cards: CatalogCard[]; hasMore: boolean };

export function CatalogView({ facets, page }: { facets: CatalogFacets; page: Page }) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(catalogParsers, {
    urlKeys: catalogUrlKeys,
    shallow: false,
    scroll: false,
    startTransition,
  });
  const [query, setQuery] = useState(filters.q);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeCount = countActiveFilters(filters);

  /** Cambiar un filtro vuelve a la primera página. */
  function update(patch: FilterPatch) {
    void setFilters({ ...patch, pagina: null });
  }

  function clearAll() {
    setQuery("");
    void setFilters(null);
  }

  const panel = <CatalogFiltersPanel facets={facets} filters={filters} onChange={update} />;

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pr-2 pb-6">
          {panel}
        </div>
      </aside>

      <section aria-labelledby="catalog-results" className="min-w-0">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Buscar espejos"
              placeholder="Buscar: redondo, LED, baño…"
              className="h-10 rounded-full pl-9"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                clearTimeout(debounce.current);
                debounce.current = setTimeout(() => update({ q: value.trim() || null }), 350);
              }}
            />
          </div>

          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" className="h-10 rounded-full px-4 lg:hidden" />}
            >
              <SlidersHorizontalIcon aria-hidden />
              Filtros
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
                  {activeCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88svh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto px-4 pb-2">{panel}</div>
              <SheetFooter className="flex-row gap-2 border-t">
                {activeCount > 0 && (
                  <Button variant="ghost" onClick={clearAll}>
                    Limpiar
                  </Button>
                )}
                <SheetTriggerClose total={page.total} pending={isPending} />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2
            id="catalog-results"
            className="mr-auto text-sm text-muted-foreground"
            aria-live="polite"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden /> Buscando…
              </span>
            ) : (
              `${page.total} ${page.total === 1 ? "espejo" : "espejos"}`
            )}
          </h2>
          <ActiveFilters filters={filters} facets={facets} onChange={update} />
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm underline underline-offset-4 hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className={cn("transition-opacity", isPending && "opacity-60")}>
          {page.cards.length > 0 ? (
            <ProductGrid cards={page.cards} />
          ) : (
            <EmptyState onClear={clearAll} />
          )}
        </div>

        {page.hasMore && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {page.cards.length} de {page.total}
            </p>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6"
              disabled={isPending}
              onClick={() => void setFilters({ pagina: filters.pagina + 1 })}
            >
              {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              Cargar más
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function SheetTriggerClose({ total, pending }: { total: number; pending: boolean }) {
  return (
    <SheetTrigger render={<Button className="flex-1" />}>
      {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
      Ver {total} {total === 1 ? "espejo" : "espejos"}
    </SheetTrigger>
  );
}

/** Chips de los filtros activos, cada uno con su botón para quitarlo. */
function ActiveFilters({
  filters,
  facets,
  onChange,
}: {
  filters: CatalogFilters;
  facets: CatalogFacets;
  onChange: (patch: FilterPatch) => void;
}) {
  const chips: Array<{ key: string; label: string; remove: FilterPatch }> = [];

  if (filters.categoria) {
    const name = facets.categories.find((category) => category.slug === filters.categoria)?.name;
    chips.push({ key: "categoria", label: name ?? filters.categoria, remove: { categoria: null } });
  }
  for (const slug of filters.forma) {
    chips.push({
      key: `forma-${slug}`,
      label: SHAPE_LABELS[SHAPE_SLUGS[slug]],
      remove: { forma: filters.forma.filter((item) => item !== slug) },
    });
  }
  for (const frame of filters.marco) {
    chips.push({
      key: `marco-${frame}`,
      label: frame,
      remove: { marco: filters.marco.filter((item) => item !== frame) },
    });
  }
  if (filters.led) chips.push({ key: "led", label: "Luz LED", remove: { led: null } });
  if (filters.disponible) {
    chips.push({ key: "disponible", label: "Entrega inmediata", remove: { disponible: null } });
  }
  const range = (min: number | null, max: number | null, unit: (n: number) => string) =>
    min !== null && max !== null
      ? `${unit(min)} – ${unit(max)}`
      : min !== null
        ? `desde ${unit(min)}`
        : `hasta ${unit(max!)}`;
  const cm = (n: number) => `${n} cm`;
  const cop = (n: number) => `$ ${formatThousands(n)}`;
  if (filters.anchoMin !== null || filters.anchoMax !== null) {
    chips.push({
      key: "ancho",
      label: `Ancho ${range(filters.anchoMin, filters.anchoMax, cm)}`,
      remove: { anchoMin: null, anchoMax: null },
    });
  }
  if (filters.altoMin !== null || filters.altoMax !== null) {
    chips.push({
      key: "alto",
      label: `Alto ${range(filters.altoMin, filters.altoMax, cm)}`,
      remove: { altoMin: null, altoMax: null },
    });
  }
  if (filters.precioMin !== null || filters.precioMax !== null) {
    chips.push({
      key: "precio",
      label: range(filters.precioMin, filters.precioMax, cop),
      remove: { precioMin: null, precioMax: null },
    });
  }

  return chips.map((chip) => (
    <button
      key={chip.key}
      type="button"
      onClick={() => onChange(chip.remove)}
      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs hover:bg-accent"
      aria-label={`Quitar filtro: ${chip.label}`}
    >
      {chip.label}
      <XIcon className="size-3" aria-hidden />
    </button>
  ));
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
      <p className="font-heading text-2xl font-semibold">No encontramos espejos con esos filtros</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Prueba quitando algún filtro. Y si no está en el catálogo, también lo fabricamos a la
        medida.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="outline" className="rounded-full" onClick={onClear}>
          Ver todos los espejos
        </Button>
        <Button className="rounded-full" nativeButton={false} render={<Link href="/a-la-medida" />}>
          <RulerIcon aria-hidden />
          Diseñar uno a la medida
        </Button>
      </div>
    </div>
  );
}
