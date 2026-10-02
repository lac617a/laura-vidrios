import { connection } from "next/server";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";

// Página provisional del Sprint 0: comprueba de punta a punta que la app lee la BD.
// La landing real se construye en el Sprint 8.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div
        aria-hidden
        className="mb-10 h-40 w-28 rounded-[50%] border border-border bg-linear-to-br from-white via-secondary to-accent shadow-inner"
      />
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
        Espejos · Envío e instalación
      </p>
      <Suspense fallback={<SiteStatusSkeleton />}>
        <SiteStatus />
      </Suspense>
      <p className="mt-6 max-w-md text-balance text-muted-foreground">
        Estamos preparando nuestro catálogo. Muy pronto podrás ver todos nuestros espejos y
        escribirnos por WhatsApp.
      </p>
    </main>
  );
}

async function getSiteStatus() {
  try {
    const [settings, products, categories] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: 1 }, select: { businessName: true } }),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);
    return { ok: true as const, businessName: settings?.businessName, products, categories };
  } catch {
    return { ok: false as const };
  }
}

async function SiteStatus() {
  // Lee la BD en cada request (no en el build).
  await connection();
  const status = await getSiteStatus();

  return (
    <>
      <h1 className="mt-4 font-heading text-5xl font-semibold sm:text-6xl">
        {(status.ok && status.businessName) || "Catálogo de espejos"}
      </h1>
      {status.ok ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {status.products} espejos publicados · {status.categories} categorías
        </p>
      ) : (
        <p className="mt-4 text-sm text-destructive">Sin conexión con la base de datos.</p>
      )}
    </>
  );
}

function SiteStatusSkeleton() {
  return (
    <>
      <div className="mt-4 h-14 w-72 animate-pulse rounded-md bg-muted sm:h-16" />
      <div className="mt-4 h-5 w-56 animate-pulse rounded-md bg-muted" />
    </>
  );
}
