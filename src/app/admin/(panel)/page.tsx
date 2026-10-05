import { ArrowRightIcon, CircleAlertIcon, InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { DailyInquiriesChart } from "@/components/admin/dashboard/daily-chart";
import { RankedBars } from "@/components/admin/dashboard/ranked-bars";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { INQUIRY_STATUS_LABELS, INQUIRY_TYPE_LABELS } from "@/lib/catalog";
import { requireAdmin } from "@/lib/dal";
import { countNewInquiries, getInquiryDashboard } from "@/lib/inquiry-admin";
import { formatPercent } from "@/lib/inquiry-stats";
import { prisma } from "@/lib/prisma";
import { getSettingsFresh } from "@/lib/settings";

export const metadata: Metadata = { title: "Resumen" };

const STATUS_BARS: Record<InquiryStatus, string> = {
  NEW: "bg-sky-500",
  CONTACTED: "bg-amber-500",
  QUOTED: "bg-violet-500",
  WON: "bg-emerald-600",
  LOST: "bg-muted-foreground/40",
};

/** Dashboard (PRD RF-A03): consultas, embudo, productos y ciudades. */
export default function AdminHomePage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireAdmin();
  const [settings, dashboard, newCount, published, drafts] = await Promise.all([
    getSettingsFresh(),
    getInquiryDashboard(),
    countNewInquiries(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
  ]);

  const kpis = [
    { label: "Consultas hoy", value: dashboard.today, href: "/admin/consultas?periodo=hoy" },
    { label: "Últimos 7 días", value: dashboard.week, href: "/admin/consultas?periodo=7d" },
    { label: "Últimos 30 días", value: dashboard.month, href: "/admin/consultas?periodo=30d" },
    {
      label: "Tasa de cierre (30 días)",
      value: formatPercent(dashboard.closeRate),
      href: "/admin/consultas?periodo=30d&estado=WON",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Así van tus consultas y tu catálogo."
      />

      {!settings.whatsappNumber && user.role === "OWNER" && (
        <Alert className="mb-6">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>Falta el número de WhatsApp</AlertTitle>
          <AlertDescription>
            <p>Sin él, los clientes no pueden escribirte desde la web.</p>
            <Button
              size="sm"
              className="mt-2"
              nativeButton={false}
              render={<Link href="/admin/configuracion" />}
            >
              Configurar ahora
              <ArrowRightIcon aria-hidden />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {newCount > 0 && (
        <Link
          href="/admin/consultas?estado=NEW"
          className="mb-6 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 transition-colors hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <InboxIcon className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">
            Tienes <strong>{newCount}</strong>{" "}
            {newCount === 1 ? "consulta nueva sin atender." : "consultas nuevas sin atender."}
          </span>
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums sm:text-4xl">{kpi.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Panel title="Consultas por día" description="Últimos 30 días, en hora de Colombia.">
        <DailyInquiriesChart data={dashboard.daily} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Por estado" description="Consultas de los últimos 30 días.">
          <RankedBars
            empty="Sin consultas en los últimos 30 días."
            items={dashboard.byStatus.map((row) => ({
              key: row.status,
              label: INQUIRY_STATUS_LABELS[row.status],
              value: row.count,
              href: `/admin/consultas?periodo=30d&estado=${row.status}`,
              barClassName: STATUS_BARS[row.status],
            }))}
          />
        </Panel>
        <Panel title="Catálogo, a la medida y generales" description="Últimos 30 días.">
          <RankedBars
            empty="Sin consultas en los últimos 30 días."
            items={dashboard.byType.map((row) => ({
              key: row.type,
              label: INQUIRY_TYPE_LABELS[row.type],
              value: row.count,
              href: `/admin/consultas?periodo=30d&tipo=${row.type}`,
            }))}
          />
        </Panel>
        <Panel title="Espejos más consultados" description="Top 5, últimos 30 días.">
          <RankedBars
            empty="Aún no hay consultas de productos."
            items={dashboard.topProducts.map((row) => ({
              key: row.id,
              label: row.name,
              detail: row.reference,
              value: row.count,
              href: `/admin/consultas?periodo=30d&producto=${row.id}`,
            }))}
          />
        </Panel>
        <Panel title="Ciudades con más consultas" description="Top 5, últimos 30 días.">
          <RankedBars
            empty="Ninguna consulta indicó ciudad todavía."
            items={dashboard.topCities.map((row) => ({
              key: row.city,
              label: row.city,
              value: row.count,
              href: `/admin/consultas?periodo=30d&ciudad=${encodeURIComponent(row.city)}`,
            }))}
          />
        </Panel>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Catálogo: <strong className="text-foreground tabular-nums">{published}</strong> espejos
        publicados y <strong className="text-foreground tabular-nums">{drafts}</strong> en borrador.{" "}
        <Link href="/admin/productos" className="underline underline-offset-4">
          Ver productos
        </Link>
      </p>
    </>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <Skeleton className="mb-2 h-10 w-56" />
      <Skeleton className="mb-6 h-5 w-40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-4 h-72" />
    </>
  );
}
