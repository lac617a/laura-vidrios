"use client";

import {
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { LazyMotion, m, MotionConfig } from "motion/react";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { MIRROR_SHAPE_CLASS } from "@/components/catalog/mirror-placeholder";
import { RadioCard } from "@/components/catalog/radio-card";
import {
  serviceCity,
  ServiceOptions,
  type ServiceInfo,
} from "@/components/catalog/service-options";
import { MirrorPreview } from "@/components/custom-order/mirror-preview";
import { HIDE_WHATSAPP_FLOAT, PageStyles } from "@/components/site/page-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { useHydrated } from "@/hooks/use-hydrated";
import { SHAPE_LABELS } from "@/lib/catalog";
import { SHAPE_SLUGS } from "@/lib/catalog-filters";
import {
  CUSTOM_NOTES_MAX,
  CUSTOM_QUANTITY_MAX,
  CUSTOM_SHAPES,
  CUSTOM_STEPS,
  customSize,
  customSizeLabel,
  DRAFT_KEY,
  EMPTY_ORDER,
  firstIncompleteStep,
  FRAME_RECOMMEND,
  normalizeNotes,
  parseDraft,
  stepError,
  SUMMARY_STEP,
  type CustomLimits,
  type CustomOrder,
} from "@/lib/custom-order";
import { hasEqualSides } from "@/lib/format";
import { inquirySource, registerInquiry, useInquiryCode } from "@/lib/inquiry-client";
import { cn } from "@/lib/utils";
import { buildCustomInquiryMessage, buildWhatsappUrl } from "@/lib/whatsapp";

const loadFeatures = () => import("@/lib/motion-features-basic").then((module) => module.default);

export type CustomOrderContext = ServiceInfo & {
  whatsappNumber: string;
  minCm: number;
  maxCm: number;
  frameOptions: string[];
};

type WizardState = { step: number; order: CustomOrder };

/**
 * Formulario guiado «A la medida» (PRD RF-M01 – RF-M05, RF-M07). Se guarda como borrador en el
 * navegador, así que solo se dibuja después de hidratar (el servidor manda un esqueleto).
 */
export function CustomOrderForm({ context }: { context: CustomOrderContext }) {
  // ?forma= es dato de URL: va en Suspense (Cache Components), con el esqueleto como respaldo.
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <HydratedWizard context={context} />
    </Suspense>
  );
}

function HydratedWizard({ context }: { context: CustomOrderContext }) {
  // useSearchParams y no window.location: en una navegación del cliente (Link desde la ficha),
  // el formulario se dibuja antes de que cambie la URL del navegador.
  const shapeSlug = useSearchParams().get("forma");
  const hydrated = useHydrated();
  return hydrated ? <Wizard context={context} shapeSlug={shapeSlug} /> : <WizardSkeleton />;
}

// ── Borrador ──────────────────────────────────────────────────────────────────

function initialState(
  context: CustomOrderContext,
  limits: CustomLimits,
  shapeSlug: string | null,
): WizardState {
  let draft: WizardState | null = null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      draft = parseDraft(JSON.parse(raw), {
        frameOptions: context.frameOptions,
        limits,
        now: Date.now(),
      });
    }
  } catch {
    // Sin acceso a localStorage (modo privado, bloqueado…): empieza vacío.
  }
  const state = draft ?? { step: 0, order: EMPTY_ORDER };

  // /a-la-medida?forma=redondo (desde la ficha o la landing) elige la forma si aún no hay una.
  const shape =
    shapeSlug && shapeSlug in SHAPE_SLUGS
      ? SHAPE_SLUGS[shapeSlug as keyof typeof SHAPE_SLUGS]
      : null;
  if (shape && !state.order.shape) return { step: 0, order: { ...state.order, shape } };
  return state;
}

function saveDraft(state: WizardState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), ...state }));
  } catch {
    // El borrador es una comodidad: si no se puede guardar, el formulario sigue funcionando.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ídem.
  }
}

// ── Formulario ────────────────────────────────────────────────────────────────

function Wizard({ context, shapeSlug }: { context: CustomOrderContext; shapeSlug: string | null }) {
  const limits: CustomLimits = { minCm: context.minCm, maxCm: context.maxCm };
  const [{ step, order }, setState] = useState<WizardState>(() =>
    initialState(context, limits, shapeSlug),
  );
  // El error del paso se muestra después de intentar avanzar (o al escribir una medida inválida).
  const [attempted, setAttempted] = useState(false);
  const [sentCode, setSentCode] = useState<string | null>(null);
  const code = useInquiryCode();

  const formRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);

  useEffect(() => saveDraft({ step, order }), [step, order]);

  // Al cambiar de paso: foco en el título del paso (lectores de pantalla) y el formulario a la vista.
  useEffect(() => {
    if (!navigated.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 64) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      formRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }
  }, [step]);

  function update(patch: Partial<CustomOrder>) {
    setState((state) => ({ ...state, order: { ...state.order, ...patch } }));
    setSentCode(null);
  }

  function goTo(next: number) {
    navigated.current = true;
    setAttempted(false);
    setState((state) => ({ ...state, step: next }));
  }

  function onContinue(event: FormEvent) {
    event.preventDefault();
    if (stepError(step, order, limits)) setAttempted(true);
    else goTo(step + 1);
  }

  function restart() {
    clearDraft();
    setSentCode(null);
    navigated.current = true;
    setAttempted(false);
    setState({ step: 0, order: EMPTY_ORDER });
  }

  const reachable = firstIncompleteStep(order, limits);
  const error = stepError(step, order, limits);
  const current = CUSTOM_STEPS[step];

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        {/* El formulario termina en WhatsApp: el botón flotante taparía «Continuar» en el celular. */}
        <PageStyles css={HIDE_WHATSAPP_FLOAT} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div ref={formRef} className="min-w-0 scroll-mt-24">
            <Progress step={step} reachable={reachable} onSelect={goTo} />

            <MirrorPreview order={order} stage={120} className="mt-6 lg:hidden" />

            <m.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-heading text-3xl font-semibold outline-none"
              >
                {STEP_HEADINGS[current.id]}
              </h2>

              {step === SUMMARY_STEP ? (
                <Summary
                  order={order}
                  context={context}
                  code={code}
                  sentCode={sentCode}
                  onEdit={goTo}
                  onSent={setSentCode}
                  onRestart={restart}
                />
              ) : (
                <form onSubmit={onContinue} noValidate className="mt-6 space-y-6">
                  <StepFields
                    stepId={current.id}
                    order={order}
                    context={context}
                    limits={limits}
                    error={error}
                    attempted={attempted}
                    onChange={update}
                  />
                  {attempted && error && current.id !== "medidas" && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="flex items-center gap-3 border-t pt-6">
                    {step > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => goTo(step - 1)}
                      >
                        <ChevronLeftIcon aria-hidden />
                        Atrás
                      </Button>
                    )}
                    <Button type="submit" className="ml-auto h-11 rounded-full px-6">
                      {step === SUMMARY_STEP - 1 ? "Ver resumen" : "Continuar"}
                      <ChevronRightIcon aria-hidden />
                    </Button>
                  </div>
                </form>
              )}
            </m.div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <MirrorPreview order={order} stage={200} />
              <p className="text-center text-sm text-muted-foreground">
                {order.shape ? SHAPE_LABELS[order.shape] : "Elige una forma"}
                {customSizeLabel(order) && ` · ${customSizeLabel(order)}`}
                {order.hasLed && " · Con luz LED"}
              </p>
            </div>
          </aside>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

const STEP_HEADINGS: Record<(typeof CUSTOM_STEPS)[number]["id"], string> = {
  forma: "¿Qué forma te gustaría?",
  medidas: "¿De qué tamaño?",
  marco: "Marco y acabado",
  detalles: "Luz y cantidad",
  entrega: "Últimos detalles",
  resumen: "Revisa tu espejo",
};

/** Pasos con número; se puede volver a cualquiera ya completo. */
function Progress({
  step,
  reachable,
  onSelect,
}: {
  step: number;
  reachable: number;
  onSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Pasos del formulario">
      <p className="text-sm text-muted-foreground sm:hidden">
        Paso {step + 1} de {CUSTOM_STEPS.length} · {CUSTOM_STEPS[step].title}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary sm:hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${((step + 1) / CUSTOM_STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="hidden flex-wrap gap-x-1 gap-y-2 sm:flex">
        {CUSTOM_STEPS.map((item, index) => {
          const done = index < step && index < reachable;
          const enabled = index <= reachable && index !== step;
          return (
            <li key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(index)}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition-colors",
                  index === step && "bg-primary font-medium text-primary-foreground",
                  index !== step && enabled && "hover:bg-secondary",
                  index !== step && !enabled && "cursor-default text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-xs tabular-nums",
                    index === step ? "border-primary-foreground/40" : "border-current/30",
                    done && "border-transparent bg-emerald-600 text-white",
                  )}
                >
                  {done ? <CheckIcon className="size-3" aria-hidden /> : index + 1}
                </span>
                {item.title}
                {done && <span className="sr-only">(completo)</span>}
              </button>
              {index < CUSTOM_STEPS.length - 1 && (
                <ChevronRightIcon className="size-3.5 text-muted-foreground/60" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Campos de cada paso ───────────────────────────────────────────────────────

function StepFields({
  stepId,
  order,
  context,
  limits,
  error,
  attempted,
  onChange,
}: {
  stepId: (typeof CUSTOM_STEPS)[number]["id"];
  order: CustomOrder;
  context: CustomOrderContext;
  limits: CustomLimits;
  error: string | null;
  attempted: boolean;
  onChange: (patch: Partial<CustomOrder>) => void;
}) {
  // Ids y nombres únicos: Next guarda las páginas visitadas ocultas en el DOM (<Activity>).
  const uid = useId();

  switch (stepId) {
    case "forma":
      return (
        <fieldset>
          <legend className="sr-only">Forma del espejo</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
            {CUSTOM_SHAPES.map((shape) => (
              <ShapeCard
                key={shape}
                name={`${uid}-forma`}
                shape={shape}
                checked={order.shape === shape}
                onSelect={() => onChange({ shape })}
              />
            ))}
          </div>
          {order.shape === "OTHER" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Cuéntanos cómo es la forma en las notas del último paso.
            </p>
          )}
        </fieldset>
      );

    case "medidas":
      return (
        <SizeFields
          order={order}
          limits={limits}
          error={error}
          attempted={attempted}
          onChange={onChange}
        />
      );

    case "marco":
      return (
        <fieldset>
          <legend className="sr-only">Marco y acabado</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...context.frameOptions, FRAME_RECOMMEND].map((frame) => (
              <RadioCard
                key={frame}
                name={`${uid}-marco`}
                checked={order.frame === frame}
                onSelect={() => onChange({ frame })}
                label={frame}
                className="min-h-14 justify-center"
              />
            ))}
          </div>
        </fieldset>
      );

    case "detalles":
      return (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">¿Con luz LED?</legend>
            <div className="grid grid-cols-2 gap-2">
              <RadioCard
                name={`${uid}-led`}
                checked={order.hasLed === true}
                onSelect={() => onChange({ hasLed: true })}
                label="Sí, con luz LED"
                detail="Ideal para baños y tocadores"
              />
              <RadioCard
                name={`${uid}-led`}
                checked={order.hasLed === false}
                onSelect={() => onChange({ hasLed: false })}
                label="No, sin luz"
              />
            </div>
          </fieldset>
          <QuantityField value={order.quantity} onChange={(quantity) => onChange({ quantity })} />
        </div>
      );

    case "entrega":
      return (
        <div className="space-y-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Notas (opcional)</span>
            <Textarea
              rows={4}
              maxLength={CUSTOM_NOTES_MAX}
              placeholder="Ej.: va en la pared del baño, sobre el lavamanos; esquinas redondeadas."
              value={order.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
            />
            <span className="block text-right text-xs text-muted-foreground tabular-nums">
              {order.notes.length}/{CUSTOM_NOTES_MAX}
            </span>
          </label>
          <ServiceOptions
            info={context}
            values={order}
            onChange={onChange}
            legend="¿Necesitas envío o instalación? (opcional)"
          />
          <PhotoReminder />
        </div>
      );

    default:
      return null;
  }
}

function ShapeCard({
  name,
  shape,
  checked,
  onSelect,
}: {
  name: string;
  shape: (typeof CUSTOM_SHAPES)[number];
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:gap-3 sm:p-4",
        checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span aria-hidden className="flex h-16 w-16 items-center justify-center">
        <span
          className={cn(
            "mirror-surface block ring-1 ring-foreground/15",
            MIRROR_SHAPE_CLASS[shape],
          )}
        />
      </span>
      <span className="text-sm font-medium">{SHAPE_LABELS[shape]}</span>
    </label>
  );
}

function SizeFields({
  order,
  limits,
  error,
  attempted,
  onChange,
}: {
  order: CustomOrder;
  limits: CustomLimits;
  error: string | null;
  attempted: boolean;
  onChange: (patch: Partial<CustomOrder>) => void;
}) {
  const uid = useId();
  const shape = order.shape ?? "RECTANGULAR";
  const equalSides = hasEqualSides(shape);
  const filled = order.width !== "" && (equalSides || order.height !== "");
  // Con los campos llenos, el error de rango se ve mientras escribe; vacíos, al intentar avanzar.
  const showError = Boolean(error) && (attempted || filled);
  const describedBy = showError ? `${uid}-error` : `${uid}-hint`;

  const field = (key: "width" | "height", label: string) => (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
        <span className="sr-only"> (cm)</span>
      </span>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          min={limits.minCm}
          max={limits.maxCm}
          step={1}
          value={order[key]}
          onChange={(event) =>
            onChange({ [key]: event.target.value.replace(/[^\d]/g, "").slice(0, 4) })
          }
          aria-invalid={showError || undefined}
          aria-describedby={describedBy}
          className="h-12 pr-12 text-lg tabular-nums"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground"
        >
          cm
        </span>
      </div>
    </label>
  );

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-4", equalSides ? "max-w-56" : "max-w-md grid-cols-2")}>
        {equalSides ? (
          field("width", shape === "ROUND" ? "Diámetro" : "Lado")
        ) : (
          <>
            {field("width", "Ancho")}
            {field("height", "Alto")}
          </>
        )}
      </div>
      {showError ? (
        <p id={`${uid}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p id={`${uid}-hint`} className="text-sm text-muted-foreground">
          Entre {limits.minCm} y {limits.maxCm} cm. Mide el espacio donde irá el espejo.
        </p>
      )}
    </div>
  );
}

function QuantityField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const uid = useId();
  const set = (next: number) => onChange(Math.min(CUSTOM_QUANTITY_MAX, Math.max(1, next)));
  return (
    <div>
      <label htmlFor={`${uid}-quantity`} className="mb-3 block text-sm font-semibold">
        ¿Cuántos espejos iguales?
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          aria-label="Uno menos"
          disabled={value <= 1}
          onClick={() => set(value - 1)}
        >
          <MinusIcon aria-hidden />
        </Button>
        <Input
          id={`${uid}-quantity`}
          type="number"
          inputMode="numeric"
          min={1}
          max={CUSTOM_QUANTITY_MAX}
          value={value}
          onChange={(event) => set(Number(event.target.value.replace(/\D/g, "")) || 1)}
          className="h-11 w-20 text-center text-lg tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          aria-label="Uno más"
          disabled={value >= CUSTOM_QUANTITY_MAX}
          onClick={() => set(value + 1)}
        >
          <PlusIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function PhotoReminder() {
  return (
    <p className="flex gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
      <CameraIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-medium">¿Tienes una foto o un plano del espacio?</strong> Envíala en
        el chat de WhatsApp después del mensaje: nos ayuda a cotizar más rápido.
      </span>
    </p>
  );
}

// ── Resumen y envío ───────────────────────────────────────────────────────────

function Summary({
  order,
  context,
  code,
  sentCode,
  onEdit,
  onSent,
  onRestart,
}: {
  order: CustomOrder;
  context: CustomOrderContext;
  code: string | null;
  sentCode: string | null;
  onEdit: (step: number) => void;
  onSent: (code: string) => void;
  onRestart: () => void;
}) {
  const size = customSize(order);
  const city = serviceCity(order);
  const notes = normalizeNotes(order.notes);
  const services = [order.needsShipping && "Envío", order.needsInstallation && "Instalación"]
    .filter(Boolean)
    .join(" e ");

  const rows: Array<{ label: string; value: ReactNode; step: number }> = [
    { label: "Forma", value: order.shape ? SHAPE_LABELS[order.shape] : "—", step: 0 },
    { label: "Medida", value: customSizeLabel(order) ?? "—", step: 1 },
    { label: "Marco", value: order.frame ?? "—", step: 2 },
    { label: "Luz LED", value: order.hasLed ? "Sí" : "No", step: 3 },
    { label: "Cantidad", value: order.quantity, step: 3 },
    { label: "Notas", value: notes || "Sin notas", step: 4 },
    {
      label: "Entrega",
      value: services ? `${services}${city ? ` · ${city}` : ""}` : "Sin envío ni instalación",
      step: 4,
    },
  ];

  const complete = Boolean(order.shape && size && order.frame && order.hasLed !== null);
  const href =
    complete && context.whatsappNumber
      ? buildWhatsappUrl(
          context.whatsappNumber,
          buildCustomInquiryMessage({
            shapeLabel: SHAPE_LABELS[order.shape!],
            sizeLabel: customSizeLabel(order)!,
            frame: order.frame!,
            hasLed: order.hasLed!,
            quantity: order.quantity,
            notes,
            needsShipping: order.needsShipping,
            needsInstallation: order.needsInstallation,
            city,
            code,
          }),
        )
      : null;

  function onClick() {
    if (!code || !size || !order.shape || !order.frame || order.hasLed === null) return;
    const channel = "a-la-medida";
    registerInquiry(
      {
        type: "CUSTOM",
        code,
        shape: order.shape,
        widthCm: size.widthCm,
        heightCm: size.heightCm,
        frame: order.frame,
        hasLed: order.hasLed,
        quantity: order.quantity,
        notes,
        needsShipping: order.needsShipping,
        needsInstallation: order.needsInstallation,
        city,
        source: inquirySource(channel),
      },
      channel,
    );
    // No cambia el enlace (el código se renueva después): WhatsApp abre con este mensaje.
    onSent(code);
  }

  return (
    <div className="mt-6 space-y-6">
      <dl className="divide-y rounded-2xl border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-4 px-4 py-3">
            <dt className="w-24 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-sm break-words whitespace-pre-line">{row.value}</dd>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              aria-label={`Cambiar ${row.label.toLowerCase()}`}
            >
              Cambiar
            </button>
          </div>
        ))}
      </dl>

      <PhotoReminder />

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <WhatsappIcon className="size-5" />
          Enviar por WhatsApp
        </a>
      ) : (
        <p className="rounded-full border border-dashed px-6 py-3 text-center text-sm text-muted-foreground">
          {context.whatsappNumber
            ? "Completa los pasos anteriores para enviar tu cotización."
            : "Muy pronto podrás enviarnos tu cotización por WhatsApp."}
        </p>
      )}

      {sentCode && (
        <p
          role="status"
          className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          Abrimos WhatsApp con tu cotización (código <strong>#{sentCode}</strong>). Envía el mensaje
          y te respondemos pronto. Si no se abrió, toca el botón de nuevo.
        </p>
      )}

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={onRestart}
        >
          <RotateCcwIcon aria-hidden />
          Empezar otra cotización
        </Button>
      </div>
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="space-y-6">
        <Skeleton className="h-8 w-full max-w-xl rounded-full" />
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((key) => (
            <Skeleton key={key} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-72 rounded-2xl lg:block" />
    </div>
  );
}
