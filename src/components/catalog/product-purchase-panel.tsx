"use client";

import { RulerIcon, TruckIcon, WrenchIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import type { PublicProduct, PublicVariant } from "@/lib/catalog-public";
import { COLOMBIA_CITIES } from "@/lib/colombia-cities";
import { formatCOP, formatMedida, hasEqualSides } from "@/lib/format";
import { inquirySource, registerInquiry, useInquiryCode } from "@/lib/inquiry-client";
import { cn } from "@/lib/utils";
import { buildProductInquiryMessage, buildWhatsappUrl, INQUIRY_CITY_MAX } from "@/lib/whatsapp";

const CUSTOM = "otra";

export type PurchaseContext = {
  whatsappNumber: string;
  siteUrl: string;
  customMinCm: number;
  customMaxCm: number;
  coverageAreas: string[];
  shippingInfo: string | null;
  installationInfo: string | null;
};

const variantKey = (variant: PublicVariant) => `${variant.widthCm}x${variant.heightCm}`;

/**
 * Elección de medida (en la URL: ?medida=60x80), servicios, ciudad y botón de WhatsApp.
 * La medida es dato de URL: va en Suspense, con la medida principal como respaldo.
 */
export function ProductPurchasePanel(props: { product: PublicProduct; context: PurchaseContext }) {
  return (
    <Suspense fallback={<PanelContent {...props} medida={null} setMedida={() => {}} />}>
      <PanelWithUrlState {...props} />
    </Suspense>
  );
}

function PanelWithUrlState(props: { product: PublicProduct; context: PurchaseContext }) {
  const [medida, setMedida] = useQueryState(
    "medida",
    parseAsString.withOptions({ history: "replace", scroll: false }),
  );
  return <PanelContent {...props} medida={medida} setMedida={(value) => void setMedida(value)} />;
}

function PanelContent({
  product,
  context,
  medida,
  setMedida,
}: {
  product: PublicProduct;
  context: PurchaseContext;
  medida: string | null;
  setMedida: (value: string | null) => void;
}) {
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [needsShipping, setNeedsShipping] = useState(false);
  const [needsInstallation, setNeedsInstallation] = useState(false);
  const [city, setCity] = useState("");
  // Ids únicos: Next guarda las fichas visitadas ocultas en el DOM (<Activity>), y un `name` o
  // `id` fijo compartiría el grupo de radios o la etiqueta con la ficha oculta.
  const uid = useId();

  const variants = product.variants;
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const isCustom = product.allowCustomSize && (medida === CUSTOM || variants.length === 0);
  const selected = isCustom
    ? null
    : (variants.find((variant) => variantKey(variant) === medida) ?? defaultVariant ?? null);
  const equalSides = hasEqualSides(product.shape);

  // Medida personalizada: enteros dentro de los límites de la configuración.
  const width = Number(customWidth);
  const height = equalSides ? width : Number(customHeight);
  const inRange = (value: number) =>
    Number.isInteger(value) && value >= context.customMinCm && value <= context.customMaxCm;
  const customFilled = customWidth !== "" && (equalSides || customHeight !== "");
  const customValid = customFilled && inRange(width) && inRange(height);

  const priceLabel =
    selected && product.showPrice && selected.price !== null ? formatCOP(selected.price) : null;
  const headline = isCustom ? "Precio a cotizar" : (priceLabel ?? "Precio a consultar");
  const sizeLabel = selected
    ? formatMedida(selected.widthCm, selected.heightCm, product.shape)
    : customValid
      ? `${formatMedida(width, height, product.shape)} (medida personalizada)`
      : "";
  // La ciudad solo cuenta si pidió envío o instalación (el campo se oculta al desmarcarlos).
  const wantsServices = needsShipping || needsInstallation;
  const serviceCity = wantsServices ? city.trim() : "";

  const code = useInquiryCode();
  const productUrl = `${context.siteUrl}/espejos/${product.slug}${
    selected ? `?medida=${variantKey(selected)}` : ""
  }`;
  const canConsult = Boolean(context.whatsappNumber) && (selected !== null || customValid);
  const whatsappHref = canConsult
    ? buildWhatsappUrl(
        context.whatsappNumber,
        buildProductInquiryMessage({
          productName: product.name,
          reference: selected?.sku ?? product.reference,
          sizeLabel,
          priceLabel,
          url: productUrl,
          needsShipping,
          needsInstallation,
          city: serviceCity,
          code,
        }),
      )
    : null;

  /** onClick de los enlaces a WhatsApp: registra la consulta sin frenar la navegación. */
  function onConsult(channel: string) {
    if (!code) return;
    registerInquiry(
      {
        type: "CATALOG",
        code,
        productId: product.id,
        sku: selected?.sku ?? null,
        customSize: selected ? null : { widthCm: width, heightCm: height },
        needsShipping,
        needsInstallation,
        city: serviceCity,
        source: inquirySource(channel),
      },
      channel,
    );
  }

  // La barra fija del celular aparece cuando el botón principal no está en pantalla.
  const ctaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLFieldSetElement>(null);
  const [ctaInView, setCtaInView] = useState(true);
  useEffect(() => {
    const target = ctaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setCtaInView(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function goToSize() {
    const fieldset = sizeRef.current;
    if (!fieldset) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fieldset.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    fieldset.querySelector<HTMLInputElement>("input[type=number]")?.focus({ preventScroll: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-semibold tabular-nums">{headline}</p>
        {selected && (
          <p
            className={cn(
              "mt-1 text-sm",
              selected.availability === "IN_STOCK" ? "text-emerald-700" : "text-muted-foreground",
            )}
          >
            {AVAILABILITY_LABELS[selected.availability]}
            {selected.availability === "MADE_TO_ORDER" && " · se fabrica para ti"}
          </p>
        )}
      </div>

      {(variants.length > 0 || product.allowCustomSize) && (
        <fieldset ref={sizeRef} className="scroll-mt-24 space-y-3">
          <legend className="mb-3 text-sm font-semibold">Medida</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variants.map((variant) => (
              <SizeOption
                key={variant.sku}
                name={`${uid}-medida`}
                checked={selected?.sku === variant.sku}
                onSelect={() =>
                  setMedida(variant.sku === defaultVariant?.sku ? null : variantKey(variant))
                }
                label={formatMedida(variant.widthCm, variant.heightCm, product.shape)}
                detail={
                  variant.availability === "OUT_OF_STOCK"
                    ? "Agotado"
                    : product.showPrice && variant.price !== null
                      ? formatCOP(variant.price)
                      : undefined
                }
                muted={variant.availability === "OUT_OF_STOCK"}
              />
            ))}
            {product.allowCustomSize && (
              <SizeOption
                name={`${uid}-medida`}
                checked={isCustom}
                onSelect={() => setMedida(CUSTOM)}
                label="Otra medida"
                detail="A tu gusto"
                icon={<RulerIcon className="size-3.5" aria-hidden />}
              />
            )}
          </div>

          {isCustom && (
            <div className="space-y-2 rounded-xl border bg-secondary/40 p-4">
              <div className={cn("grid gap-3", !equalSides && "grid-cols-2")}>
                <label className="space-y-1">
                  <span className="text-sm">
                    {product.shape === "ROUND" ? "Diámetro" : equalSides ? "Lado" : "Ancho"} (cm)
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={context.customMinCm}
                    max={context.customMaxCm}
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                    aria-invalid={customFilled && !inRange(width)}
                  />
                </label>
                {!equalSides && (
                  <label className="space-y-1">
                    <span className="text-sm">Alto (cm)</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={context.customMinCm}
                      max={context.customMaxCm}
                      value={customHeight}
                      onChange={(event) => setCustomHeight(event.target.value)}
                      aria-invalid={customFilled && !inRange(height)}
                    />
                  </label>
                )}
              </div>
              <p
                className={cn(
                  "text-xs",
                  customFilled && !customValid ? "text-destructive" : "text-muted-foreground",
                )}
                role={customFilled && !customValid ? "alert" : undefined}
              >
                Medidas entre {context.customMinCm} y {context.customMaxCm} cm. Te enviamos la
                cotización por WhatsApp.
              </p>
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold">¿Necesitas algo más? (opcional)</legend>
        <ServiceCheckbox
          id={`${uid}-shipping`}
          icon={<TruckIcon className="size-4" aria-hidden />}
          label="Envío"
          checked={needsShipping}
          onChange={setNeedsShipping}
          info={needsShipping ? context.shippingInfo : null}
        />
        <ServiceCheckbox
          id={`${uid}-installation`}
          icon={<WrenchIcon className="size-4" aria-hidden />}
          label="Instalación"
          checked={needsInstallation}
          onChange={setNeedsInstallation}
          info={
            needsInstallation
              ? (context.installationInfo ??
                (context.coverageAreas.length > 0
                  ? `Instalamos en ${joinList(context.coverageAreas)}.`
                  : null))
              : null
          }
        />
        {wantsServices && (
          <label className="block space-y-1">
            <span className="text-sm">Ciudad</span>
            <Input
              list={`${uid}-cities`}
              autoComplete="address-level2"
              placeholder="Ej. Medellín"
              maxLength={INQUIRY_CITY_MAX}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
            <datalist id={`${uid}-cities`}>
              {COLOMBIA_CITIES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
        )}
      </fieldset>

      <div ref={ctaRef}>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onConsult("detalle")}
            data-testid="whatsapp-cta"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <WhatsappIcon className="size-5" />
            Consultar por WhatsApp
          </a>
        ) : (
          <p className="rounded-full border border-dashed px-6 py-3 text-center text-sm text-muted-foreground">
            {!context.whatsappNumber
              ? "Muy pronto podrás consultarnos por WhatsApp."
              : "Escribe la medida que necesitas para consultar."}
          </p>
        )}
      </div>

      {context.whatsappNumber && (
        <StickyConsultBar
          visible={!ctaInView}
          headline={headline}
          detail={sizeLabel || "Escribe tu medida"}
          href={whatsappHref}
          onConsult={() => onConsult("barra-movil")}
          onChooseSize={goToSize}
        />
      )}
    </div>
  );
}

/** Barra inferior fija en el celular (y tablet): precio, medida y el botón de WhatsApp. */
function StickyConsultBar({
  visible,
  headline,
  detail,
  href,
  onConsult,
  onChooseSize,
}: {
  visible: boolean;
  headline: string;
  detail: string;
  href: string | null;
  onConsult: () => void;
  onChooseSize: () => void;
}) {
  const action =
    "flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
  return (
    <>
      <ProductPageStyles />
      <div
        data-testid="sticky-cta"
        inert={!visible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_oklch(0.3_0.02_60/0.25)] backdrop-blur transition-[translate,visibility] duration-300 motion-reduce:transition-none lg:hidden",
          // invisible al terminar de bajar: sale del árbol de accesibilidad y del orden de foco.
          visible ? "visible translate-y-0" : "invisible translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold tabular-nums">{headline}</p>
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          </div>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onConsult}
              className={cn(action, "bg-primary text-primary-foreground hover:bg-primary/85")}
            >
              <WhatsappIcon className="size-4" />
              Consultar
            </a>
          ) : (
            <button
              type="button"
              onClick={onChooseSize}
              className={cn(action, "border bg-background hover:bg-secondary")}
            >
              <RulerIcon className="size-4" aria-hidden />
              Elegir medida
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Mientras la ficha está visible: sin botón flotante (aquí manda el botón de consulta) y con espacio
// abajo para que la barra fija no tape el footer en el celular.
const PRODUCT_PAGE_CSS =
  "[data-whatsapp-float]{display:none}" +
  "@media (width < 64rem){body{padding-bottom:calc(4.5rem + env(safe-area-inset-bottom))}}";

/**
 * Next guarda las páginas visitadas ocultas en el DOM (<Activity>). Al ocultarse la ficha, la
 * limpieza del ref desactiva la hoja con media="not all" para que no afecte a la página visible.
 * Viene en el HTML del servidor: no hay parpadeo del botón flotante al cargar.
 */
function ProductPageStyles() {
  return (
    <style
      ref={(style) => {
        if (style) style.media = "all";
        return () => {
          if (style) style.media = "not all";
        };
      }}
    >
      {PRODUCT_PAGE_CSS}
    </style>
  );
}

function joinList(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items.at(-1)}` : items[0];
}

function SizeOption({
  name,
  checked,
  onSelect,
  label,
  detail,
  muted = false,
  icon,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  detail?: string;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
        muted && "opacity-60",
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

function ServiceCheckbox({
  id,
  icon,
  label,
  checked,
  onChange,
  info,
}: {
  id: string;
  icon: React.ReactNode;
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
        <span className="text-sm">Necesito {label.toLowerCase()}</span>
      </label>
      {info && <p className="mt-1.5 px-1 text-xs text-muted-foreground">{info}</p>}
    </div>
  );
}
