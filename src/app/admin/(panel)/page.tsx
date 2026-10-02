import { ArrowRightIcon, CircleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getSettingsFresh } from "@/lib/settings";

export const metadata: Metadata = { title: "Resumen" };

// Resumen provisional: el dashboard completo llega en el Sprint 9.
export default function AdminHomePage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireAdmin();
  const [settings, published, drafts, newInquiries] = await Promise.all([
    getSettingsFresh(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
  ]);

  const stats = [
    { label: "Espejos publicados", value: published },
    { label: "Borradores", value: drafts },
    { label: "Consultas nuevas", value: newInquiries },
  ];

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Así va tu catálogo hoy."
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-4xl tabular-nums">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <Skeleton className="mb-2 h-10 w-56" />
      <Skeleton className="mb-6 h-5 w-40" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-28" />
        ))}
      </div>
    </>
  );
}
