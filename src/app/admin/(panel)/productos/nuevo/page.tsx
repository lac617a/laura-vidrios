import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/products/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductFormOptions } from "@/lib/catalog-admin-queries";
import { requireAdmin } from "@/lib/dal";
import { emptyVariant, type ProductFormValues } from "@/lib/validations/product";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Nuevo producto"
        description="Se guarda como borrador hasta que lo publiques."
      />
      <Suspense fallback={<Skeleton className="h-[720px] w-full" />}>
        <NewProductLoader />
      </Suspense>
    </>
  );
}

async function NewProductLoader() {
  await requireAdmin();
  const options = await getProductFormOptions();

  const defaultValues: ProductFormValues = {
    name: "",
    slug: "",
    reference: "",
    categoryId: options.categories.length === 1 ? options.categories[0].id : "",
    shape: "RECTANGULAR",
    description: "",
    frameMaterial: "",
    frameColor: "",
    style: "",
    hasLed: false,
    isFeatured: false,
    showPrice: true,
    allowCustomSize: true,
    status: "DRAFT",
    variants: [{ ...emptyVariant(), isDefault: true }],
  };

  return <ProductForm defaultValues={defaultValues} {...options} />;
}
