import { MapPinIcon, TruckIcon } from "lucide-react";
import Link from "next/link";

import { InquiryStatusBadge, InquiryTypeBadge } from "@/components/admin/inquiries/inquiry-badges";
import { formatDateTime } from "@/lib/dates";
import type { AdminInquiryRow, InquiryListParams } from "@/lib/inquiry-admin";
import { inquiriesHref, inquiryItemSize, inquiryServices } from "@/lib/inquiry-display";
import { cn } from "@/lib/utils";

/** Resumen de los productos de la consulta: "Espejo Luna LED · Ø 60 cm". */
function itemsSummary(inquiry: AdminInquiryRow) {
  if (inquiry.items.length === 0) return "Consulta general";
  const [first] = inquiry.items;
  const size = inquiryItemSize(first);
  const extra = inquiry.items.length > 1 ? ` y ${inquiry.items.length - 1} más` : "";
  const quantity = first.quantity > 1 ? ` (×${first.quantity})` : "";
  return `${first.productName}${size ? ` · ${size}` : ""}${quantity}${extra}`;
}

/**
 * Lista de consultas (PRD RF-A12): tabla en desktop y tarjetas en el celular. Cada fila abre el
 * detalle en el panel lateral (?consulta=id), sin perder los filtros.
 */
export function InquiryList({
  inquiries,
  params,
}: {
  inquiries: AdminInquiryRow[];
  params: InquiryListParams;
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {inquiries.map((inquiry) => {
        const services = inquiryServices(inquiry);
        const open = params.consulta === inquiry.id;
        return (
          <li key={inquiry.id}>
            <Link
              href={inquiriesHref(params, { consulta: inquiry.id })}
              scroll={false}
              aria-current={open ? "true" : undefined}
              className={cn(
                "grid gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none md:grid-cols-[7.5rem_minmax(0,1fr)_10rem_7rem] md:items-center",
                inquiry.status === "NEW" && "bg-sky-50/60 dark:bg-sky-950/20",
                open && "bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2 md:block">
                <p className="font-mono text-sm font-semibold tracking-wide">#{inquiry.code}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(inquiry.createdAt)}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{itemsSummary(inquiry)}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <InquiryTypeBadge type={inquiry.type} />
                  {inquiry.customerName && <span>{inquiry.customerName}</span>}
                  {services && (
                    <span className="inline-flex items-center gap-1">
                      <TruckIcon className="size-3.5" aria-hidden />
                      {services}
                    </span>
                  )}
                </p>
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                {inquiry.city && (
                  <>
                    <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{inquiry.city}</span>
                  </>
                )}
              </p>
              <div className="md:text-right">
                <InquiryStatusBadge status={inquiry.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
