"use client";

import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { saveInquiryDetails, setInquiryStatus } from "@/app/admin/(panel)/consultas/actions";
import { InquiryTypeBadge, STATUS_STYLES } from "@/components/admin/inquiries/inquiry-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { useAdminAction } from "@/hooks/use-admin-action";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES } from "@/lib/catalog";
import { formatDateTime } from "@/lib/dates";
import { formatCOP } from "@/lib/format";
import type { AdminInquiry } from "@/lib/inquiry-admin";
import { normalizeInquiryCode } from "@/lib/inquiry-code";
import { inquiryItemShape, inquiryItemSize, inquiryServices } from "@/lib/inquiry-display";
import { cn } from "@/lib/utils";
import { buildWhatsappUrl, formatWhatsappNumber } from "@/lib/whatsapp";

/**
 * Detalle de una consulta en un panel lateral (PRD RF-A14): estado, lo que pidió el cliente
 * (snapshot), y datos que la dueña completa al atenderla. Se abre con ?consulta=id.
 */
export function InquiryDrawer({ inquiry }: { inquiry: AdminInquiry }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("consulta");
    // Si se llegó buscando su código, al cerrar se vuelve al listado completo.
    const q = params.get("q");
    if (q && inquiry.code.startsWith(normalizeInquiryCode(q))) params.delete("q");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  const services = inquiryServices(inquiry);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="border-b pr-12">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono text-xl font-semibold tracking-wide">
              #{inquiry.code}
            </SheetTitle>
            <CopyCode code={inquiry.code} />
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <span>{formatDateTime(inquiry.createdAt)}</span>
            <InquiryTypeBadge type={inquiry.type} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <StatusPicker id={inquiry.id} status={inquiry.status} />

          <section aria-labelledby="inquiry-items" className="space-y-2">
            <h3 id="inquiry-items" className="text-sm font-semibold">
              {inquiry.items.length > 0 ? "Lo que consultó" : "Consulta general"}
            </h3>
            {inquiry.items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Escribió desde el botón de WhatsApp sin elegir un espejo.
              </p>
            )}
            <ul className="space-y-2">
              {inquiry.items.map((item) => (
                <li key={item.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Ref. {item.reference}</p>
                    </div>
                    {item.priceSnapshot !== null && (
                      <p className="shrink-0 tabular-nums">{formatCOP(item.priceSnapshot)}</p>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-xs">
                    {inquiryItemShape(item) && <Row label="Forma">{inquiryItemShape(item)}</Row>}
                    {inquiryItemSize(item) && (
                      <Row label="Medida">
                        {inquiryItemSize(item)}
                        {item.isCustomSize && !item.customShape && " (personalizada)"}
                      </Row>
                    )}
                    {item.frameDetails && <Row label="Marco">{item.frameDetails}</Row>}
                    {item.hasLed !== null && <Row label="Luz LED">{item.hasLed ? "Sí" : "No"}</Row>}
                    {item.quantity > 1 && <Row label="Cantidad">{item.quantity}</Row>}
                    {item.notes && (
                      <Row label="Notas">
                        <span className="whitespace-pre-line">{item.notes}</span>
                      </Row>
                    )}
                  </dl>
                  {item.product && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {item.product.status === "PUBLISHED" && (
                        <a
                          href={`/espejos/${item.product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                        >
                          <ExternalLinkIcon className="size-3.5" aria-hidden />
                          Ver en la web
                        </a>
                      )}
                      <Link
                        href={`/admin/productos/${item.product.id}`}
                        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                      >
                        <PencilIcon className="size-3.5" aria-hidden />
                        Editar producto
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {(services || inquiry.city) && (
            <section className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {services && (
                <span className="inline-flex items-center gap-1.5">
                  <TruckIcon className="size-4" aria-hidden />
                  {services}
                </span>
              )}
              {inquiry.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="size-4" aria-hidden />
                  {inquiry.city}
                </span>
              )}
            </section>
          )}

          <CustomerForm inquiry={inquiry} />

          {inquiry.source && (
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Origen: <span className="font-mono">{inquiry.source}</span>
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Código copiado" : "Copiar código"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`#${code}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("No se pudo copiar.");
        }
      }}
    >
      {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
    </Button>
  );
}

/** Embudo Nueva → Contactada → Cotizada → Vendida / Perdida, con un toque. */
function StatusPicker({ id, status }: { id: string; status: InquiryStatus }) {
  const { run, pending } = useAdminAction();
  const [optimistic, setOptimistic] = useState(status);

  return (
    <fieldset disabled={pending}>
      <legend className="mb-2 text-sm font-semibold">Estado</legend>
      <div className="flex flex-wrap gap-2">
        {INQUIRY_STATUSES.map((value) => {
          const active = optimistic === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (active) return;
                setOptimistic(value);
                run(
                  async () => {
                    const result = await setInquiryStatus(id, value);
                    if (!result.ok) setOptimistic(status);
                    return result;
                  },
                  { success: `Consulta ${INQUIRY_STATUS_LABELS[value].toLowerCase()}.` },
                );
              }}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
                active
                  ? cn(STATUS_STYLES[value], "border-transparent font-medium")
                  : "hover:bg-muted",
              )}
            >
              {active && <CheckIcon className="size-3.5" aria-hidden />}
              {INQUIRY_STATUS_LABELS[value]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CustomerForm({ inquiry }: { inquiry: AdminInquiry }) {
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState({
    customerName: inquiry.customerName ?? "",
    customerPhone: inquiry.customerPhone ? formatWhatsappNumber(inquiry.customerPhone) : "",
    notes: inquiry.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const dirty =
    values.customerName !== (inquiry.customerName ?? "") ||
    values.notes !== (inquiry.notes ?? "") ||
    values.customerPhone !==
      (inquiry.customerPhone ? formatWhatsappNumber(inquiry.customerPhone) : "");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setErrors({});
        run(
          async () => {
            const result = await saveInquiryDetails(inquiry.id, values);
            if (!result.ok) setErrors(result.fieldErrors ?? {});
            return result;
          },
          { success: "Datos guardados." },
        );
      }}
      className="space-y-3 rounded-xl bg-secondary/50 p-4"
    >
      <h3 className="text-sm font-semibold">Cliente</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Nombre</span>
          <Input
            value={values.customerName}
            maxLength={80}
            autoComplete="off"
            onChange={(event) => setValues({ ...values, customerName: event.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Celular (WhatsApp)</span>
          <Input
            value={values.customerPhone}
            inputMode="tel"
            autoComplete="off"
            placeholder="300 123 4567"
            aria-invalid={Boolean(errors.customerPhone)}
            onChange={(event) => {
              setValues({ ...values, customerPhone: event.target.value });
              setErrors({ ...errors, customerPhone: undefined });
            }}
          />
          {errors.customerPhone && (
            <span className="text-xs text-destructive">{errors.customerPhone[0]}</span>
          )}
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Notas internas</span>
        <Textarea
          rows={3}
          maxLength={2000}
          placeholder="Precio cotizado, fecha de instalación, acuerdos…"
          value={values.notes}
          onChange={(event) => setValues({ ...values, notes: event.target.value })}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!dirty || pending}>
          {pending && <Loader2Icon className="animate-spin" aria-hidden />}
          Guardar
        </Button>
        {inquiry.customerPhone && (
          // Enlace (no botón): abre el chat del cliente en WhatsApp.
          <a
            href={buildWhatsappUrl(inquiry.customerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <WhatsappIcon className="text-whatsapp" />
            Abrir chat
          </a>
        )}
      </div>
    </form>
  );
}
