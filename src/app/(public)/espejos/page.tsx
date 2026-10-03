import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogView } from "@/components/catalog/catalog-view";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCatalogFilters } from "@/lib/catalog-filters";
import { getCatalogFacets, getCatalogPage } from "@/lib/catalog-public";

export const metadata: Metadata = {
  title: "Catálogo de espejos",
  description:
    "Espejos redondos, rectangulares, con luz LED, de cuerpo entero y a la medida. Consulta precios y medidas, y escríbenos por WhatsApp.",
  alternates: { canonical: "/espejos" },
};

export default function CatalogPage({ searchParams }: PageProps<"/espejos">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16 sm:pt-12">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">Catálogo</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold text-balance sm:text-5xl">
          Encuentra el espejo para tu espacio
        </h1>
        <p className="mt-3 text-muted-foreground">
          Filtra por forma, medida o estilo. ¿Te gusta uno? Escríbenos por WhatsApp desde su ficha.
        </p>
      </header>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/espejos">["searchParams"] }) {
  const filters = loadCatalogFilters(await searchParams);
  // Ambas lecturas están cacheadas ("use cache") e invalidadas desde el admin.
  const [facets, page] = await Promise.all([getCatalogFacets(), getCatalogPage(filters)]);
  return <CatalogView facets={facets} page={page} />;
}

function CatalogSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <div className="hidden space-y-4 lg:block">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24 w-full" />
        ))}
      </div>
      <div>
        <Skeleton className="mb-6 h-10 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
            <div key={key}>
              <Skeleton className="aspect-4/5 w-full rounded-xl" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
