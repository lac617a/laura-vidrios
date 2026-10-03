"use client";

import { useRef, useState, type ReactNode } from "react";

import { PriceInput } from "@/components/admin/price-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { shapeSlugOf, type CatalogFilters, type ShapeSlug } from "@/lib/catalog-filters";
import type { CatalogFacets } from "@/lib/catalog-public";
import { cn } from "@/lib/utils";

export type FilterPatch = Partial<{ [K in keyof CatalogFilters]: CatalogFilters[K] | null }>;

/** Filtros del catálogo. Controlado: lee `filters` y emite cambios con `onChange`. */
export function CatalogFiltersPanel({
  facets,
  filters,
  onChange,
}: {
  facets: CatalogFacets;
  filters: CatalogFilters;
  onChange: (patch: FilterPatch) => void;
}) {
  function toggle<T extends string>(list: T[], value: T): T[] | null {
    const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    return next.length ? next : null;
  }

  return (
    <div className="space-y-6">
      {facets.categories.length > 0 && (
        <FilterGroup title="Categoría">
          <div className="flex flex-wrap gap-2">
            <Chip pressed={filters.categoria === ""} onClick={() => onChange({ categoria: null })}>
              Todas
            </Chip>
            {facets.categories.map((category) => (
              <Chip
                key={category.slug}
                pressed={filters.categoria === category.slug}
                count={category.count}
                onClick={() =>
                  onChange({
                    categoria: filters.categoria === category.slug ? null : category.slug,
                  })
                }
              >
                {category.name}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}

      {facets.shapes.length > 1 && (
        <FilterGroup title="Forma">
          <div className="flex flex-wrap gap-2">
            {facets.shapes.map(({ shape, label, count }) => {
              const slug: ShapeSlug = shapeSlugOf(shape);
              return (
                <Chip
                  key={shape}
                  pressed={filters.forma.includes(slug)}
                  count={count}
                  onClick={() => onChange({ forma: toggle(filters.forma, slug) })}
                >
                  {label}
                </Chip>
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Medidas (cm)" hint="Muestra espejos con al menos una medida en el rango.">
        <RangeFields
          key={`ancho-${filters.anchoMin}-${filters.anchoMax}`}
          label="Ancho"
          min={filters.anchoMin}
          max={filters.anchoMax}
          onCommit={(min, max) => onChange({ anchoMin: min, anchoMax: max })}
        />
        <RangeFields
          key={`alto-${filters.altoMin}-${filters.altoMax}`}
          label="Alto"
          min={filters.altoMin}
          max={filters.altoMax}
          onCommit={(min, max) => onChange({ altoMin: min, altoMax: max })}
        />
      </FilterGroup>

      {facets.frames.length > 1 && (
        <FilterGroup title="Marco o material">
          <div className="flex flex-wrap gap-2">
            {facets.frames.map((frame) => (
              <Chip
                key={frame.value}
                pressed={filters.marco.includes(frame.value)}
                count={frame.count}
                onClick={() => onChange({ marco: toggle(filters.marco, frame.value) })}
              >
                {frame.value}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Características">
        {facets.hasLed && (
          <SwitchRow
            id="filter-led"
            label="Con luz LED"
            checked={filters.led}
            onChange={(checked) => onChange({ led: checked || null })}
          />
        )}
        <SwitchRow
          id="filter-stock"
          label="Disponible para entrega inmediata"
          checked={filters.disponible}
          onChange={(checked) => onChange({ disponible: checked || null })}
        />
      </FilterGroup>

      <FilterGroup title="Precio (COP)">
        <RangeFields
          key={`precio-${filters.precioMin}-${filters.precioMax}`}
          label="Precio"
          price
          min={filters.precioMin}
          max={filters.precioMax}
          onCommit={(min, max) => onChange({ precioMin: min, precioMax: max })}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{title}</legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Chip({
  pressed,
  count,
  onClick,
  children,
}: {
  pressed: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:border-foreground/30 hover:bg-muted",
      )}
    >
      {children}
      {count !== undefined && <span className="text-xs tabular-nums opacity-60">{count}</span>}
    </button>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Desde / hasta. Se aplica 700 ms después de dejar de escribir. */
function RangeFields({
  label,
  min,
  max,
  price = false,
  onCommit,
}: {
  label: string;
  min: number | null;
  max: number | null;
  price?: boolean;
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const [from, setFrom] = useState<number | null>(min);
  const [to, setTo] = useState<number | null>(max);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function change(edge: "from" | "to", value: number | null) {
    const nextFrom = edge === "from" ? value : from;
    const nextTo = edge === "to" ? value : to;
    setFrom(nextFrom);
    setTo(nextTo);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(nextFrom, nextTo), 700);
  }

  const id = `range-${label.toLowerCase()}`;
  const edges = [
    { key: "from", text: "Desde", value: from },
    { key: "to", text: "Hasta", value: to },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
      {edges.map((edge) => (
        <label key={edge.key} className="space-y-1">
          <span className="text-xs text-muted-foreground">
            {price ? edge.text : `${label} ${edge.text.toLowerCase()}`}
          </span>
          {price ? (
            <PriceInput
              id={`${id}-${edge.key}`}
              value={edge.value}
              onChange={(value) => change(edge.key, value)}
            />
          ) : (
            <Input
              id={`${id}-${edge.key}`}
              type="number"
              inputMode="numeric"
              min={1}
              value={edge.value ?? ""}
              onChange={(event) =>
                change(
                  edge.key,
                  event.target.value === "" ? null : Math.max(0, Number(event.target.value)),
                )
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}
