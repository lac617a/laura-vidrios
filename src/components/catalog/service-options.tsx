"use client";

import { TruckIcon, WrenchIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { COLOMBIA_CITIES } from "@/lib/colombia-cities";
import { joinList } from "@/lib/text";
import { cn } from "@/lib/utils";
import { INQUIRY_CITY_MAX } from "@/lib/whatsapp";

// Envío, instalación y ciudad (PRD RF-D08 y RF-M04): ficha de producto y «A la medida».

export type ServiceInfo = {
  shippingInfo: string | null;
  installationInfo: string | null;
  coverageAreas: string[];
};

export type ServiceValues = {
  needsShipping: boolean;
  needsInstallation: boolean;
  city: string;
};

/** La ciudad solo cuenta si pidió envío o instalación (el campo se oculta al desmarcarlos). */
export function serviceCity(values: ServiceValues): string {
  return values.needsShipping || values.needsInstallation ? values.city.trim() : "";
}

export function ServiceOptions({
  info,
  values,
  onChange,
  legend = "¿Necesitas algo más? (opcional)",
}: {
  info: ServiceInfo;
  values: ServiceValues;
  onChange: (patch: Partial<ServiceValues>) => void;
  legend?: string;
}) {
  // Ids únicos: Next guarda las páginas visitadas ocultas en el DOM (<Activity>).
  const uid = useId();
  const installationInfo =
    info.installationInfo ??
    (info.coverageAreas.length > 0 ? `Instalamos en ${joinList(info.coverageAreas)}.` : null);

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <ServiceCheckbox
        id={`${uid}-shipping`}
        icon={<TruckIcon className="size-4" aria-hidden />}
        label="Necesito envío"
        checked={values.needsShipping}
        onChange={(needsShipping) => onChange({ needsShipping })}
        info={values.needsShipping ? info.shippingInfo : null}
      />
      <ServiceCheckbox
        id={`${uid}-installation`}
        icon={<WrenchIcon className="size-4" aria-hidden />}
        label="Necesito instalación"
        checked={values.needsInstallation}
        onChange={(needsInstallation) => onChange({ needsInstallation })}
        info={values.needsInstallation ? installationInfo : null}
      />
      {(values.needsShipping || values.needsInstallation) && (
        <label className="block space-y-1">
          <span className="text-sm">Ciudad</span>
          <Input
            list={`${uid}-cities`}
            autoComplete="address-level2"
            placeholder="Ej. Medellín"
            maxLength={INQUIRY_CITY_MAX}
            value={values.city}
            onChange={(event) => onChange({ city: event.target.value })}
          />
          <datalist id={`${uid}-cities`}>
            {COLOMBIA_CITIES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      )}
    </fieldset>
  );
}

function ServiceCheckbox({
  id,
  icon,
  label,
  checked,
  onChange,
  info,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  info: string | null;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          checked ? "border-primary bg-primary/5" : "hover:border-foreground/30",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        {icon}
        <span className="text-sm">{label}</span>
      </label>
      {info && <p className="mt-1.5 px-1 text-xs text-muted-foreground">{info}</p>}
    </div>
  );
}
