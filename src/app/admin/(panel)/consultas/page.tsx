import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { InquiryDrawer } from "@/components/admin/inquiries/inquiry-drawer";
import { InquiryFilters } from "@/components/admin/inquiries/inquiry-filters";
import { InquiryList } from "@/components/admin/inquiries/inquiry-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/dal";
import {
  findInquiryIdByCode,
  getAdminInquiry,
  INQUIRY_PAGE_SIZE,
  listAdminInquiries,
  listInquiryFilterOptions,
  parseInquiryListParams,
  type InquiryListParams,
} from "@/lib/inquiry-admin";
import { inquiriesHref } from "@/lib/inquiry-display";

export const metadata: Metadata = { title: "Consultas" };

export default function InquiriesPage({ searchParams }: PageProps<"/admin/consultas">) {
  return (
    <>
      <PageHeader
        title="Consultas"
        description="Cada toque en «Consultar por WhatsApp» queda aquí con su código. Búscalo con el que llegó en el mensaje."
      />
      <Suspense fallback={<ListSkeleton />}>
        <InquiriesLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function InquiriesLoader({
  searchParams,
}: {
  searchParams: PageProps<"/admin/consultas">["searchParams"];
}) {
  await requireAdmin();
  const params = parseInquiryListParams(await searchParams);
  const [list, options] = await Promise.all([
    listAdminInquiries(params),
    listInquiryFilterOptions(),
  ]);

  // Búsqueda por código con un solo resultado: se abre directo (PRD RF-A13).
  const openId =
    params.consulta || (params.q && list.total === 1 ? await findInquiryIdByCode(params.q) : null);
  const detail = openId ? await getAdminInquiry(openId) : null;
  const filtered =
    params.q ||
    params.estado !== "todas" ||
    params.tipo !== "todos" ||
    params.periodo !== "todo" ||
    params.ciudad ||
    params.producto;

  return (
    <>
      <InquiryFilters options={options} counts={list.counts} />
      {list.inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {filtered
            ? "No hay consultas con esos filtros."
            : "Aún no hay consultas. Llegan cuando un cliente toca «Consultar por WhatsApp» en la web."}
        </div>
      ) : (
        <InquiryList
          inquiries={list.inquiries}
          params={{ ...params, consulta: detail?.id ?? "" }}
        />
      )}
      <Pagination params={params} total={list.total} pageCount={list.pageCount} />
      {detail && <InquiryDrawer key={detail.id} inquiry={detail} />}
    </>
  );
}

function Pagination({
  params,
  total,
  pageCount,
}: {
  params: InquiryListParams;
  total: number;
  pageCount: number;
}) {
  if (total === 0) return null;
  const from = (params.pagina - 1) * INQUIRY_PAGE_SIZE + 1;
  const to = Math.min(params.pagina * INQUIRY_PAGE_SIZE, total);
  const href = (page: number) => inquiriesHref(params, { pagina: page, consulta: null });

  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        {from}–{to} de {total}
      </span>
      {pageCount > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={params.pagina <= 1}
            render={<Link href={href(params.pagina - 1)} aria-disabled={params.pagina <= 1} />}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={params.pagina >= pageCount}
            render={
              <Link href={href(params.pagina + 1)} aria-disabled={params.pagina >= pageCount} />
            }
          >
            Siguiente
          </Button>
        </div>
      )}
    </nav>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-8 w-full max-w-xl" />
      {[0, 1, 2, 3, 4].map((key) => (
        <Skeleton key={key} className="h-16 w-full" />
      ))}
    </div>
  );
}
