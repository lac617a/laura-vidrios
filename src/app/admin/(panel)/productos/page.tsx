import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductList } from "@/components/admin/products/product-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_PAGE_SIZE,
  listAdminProducts,
  listCategoryOptions,
  productListParamsSchema,
  type ProductListParams,
} from "@/lib/catalog-admin-queries";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Productos" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  return (
    <>
      <PageHeader
        title="Productos"
        description="Todos los espejos del catálogo, con sus medidas y precios."
        actions={
          <Button nativeButton={false} render={<Link href="/admin/productos/nuevo" />}>
            <PlusIcon aria-hidden />
            Nuevo producto
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ProductsLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductsLoader({
  searchParams,
}: {
  searchParams: PageProps<"/admin/productos">["searchParams"];
}) {
  await requireAdmin();
  const raw = await searchParams;
  const params = productListParamsSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );

  const [{ products, total, pageCount, counts }, categories] = await Promise.all([
    listAdminProducts(params),
    listCategoryOptions(),
  ]);

  return (
    <>
      <ProductFilters categories={categories} counts={counts} />
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {params.q || params.categoria
            ? "No hay productos con esos filtros."
            : "Aún no hay productos aquí."}
        </div>
      ) : (
        <ProductList products={products} />
      )}
      <Pagination params={params} total={total} pageCount={pageCount} />
    </>
  );
}

function Pagination({
  params,
  total,
  pageCount,
}: {
  params: ProductListParams;
  total: number;
  pageCount: number;
}) {
  if (total === 0) return null;
  const from = (params.pagina - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(params.pagina * ADMIN_PAGE_SIZE, total);

  function hrefFor(page: number) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.categoria) search.set("categoria", params.categoria);
    if (params.estado !== "activos") search.set("estado", params.estado);
    if (page > 1) search.set("pagina", String(page));
    const query = search.toString();
    return query ? `/admin/productos?${query}` : "/admin/productos";
  }

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
            render={<Link href={hrefFor(params.pagina - 1)} aria-disabled={params.pagina <= 1} />}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={params.pagina >= pageCount}
            render={
              <Link href={hrefFor(params.pagina + 1)} aria-disabled={params.pagina >= pageCount} />
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
      <Skeleton className="h-9 w-full" />
      {[0, 1, 2, 3, 4].map((key) => (
        <Skeleton key={key} className="h-16 w-full" />
      ))}
    </div>
  );
}
