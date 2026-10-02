import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryManager } from "@/components/admin/categories/category-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategoriesWithCounts } from "@/lib/catalog-admin-queries";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Categorías" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categorías"
        description="Agrupan los espejos en el catálogo. El orden de esta lista es el orden en la web."
      />
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <CategoriesLoader />
      </Suspense>
    </>
  );
}

async function CategoriesLoader() {
  await requireAdmin();
  const categories = await listCategoriesWithCounts();
  return <CategoryManager categories={categories} />;
}
