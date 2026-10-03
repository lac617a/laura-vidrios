import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FormSection } from "@/components/admin/form-section";
import { ProductImagesManager } from "@/components/admin/images/product-images-manager";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/products/product-form";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductForEdit, getProductFormOptions } from "@/lib/catalog-admin-queries";
import { getCloudinaryConfig } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Editar producto" };

export default function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[720px] w-full" />}>
      <EditProductLoader params={params} />
    </Suspense>
  );
}

async function EditProductLoader({
  params,
}: {
  params: PageProps<"/admin/productos/[id]">["params"];
}) {
  await requireAdmin();
  const { id } = await params;
  const [product, options] = await Promise.all([getProductForEdit(id), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.values.name}
        description={`Referencia ${product.reference}`}
        actions={<ProductStatusBadge status={product.status} />}
      />
      <div className="mb-8">
        <FormSection
          title="Fotos"
          description="Se guardan al instante. Arrastra o elige varias a la vez; desde el celular puedes usar la cámara."
        >
          <ProductImagesManager
            productId={product.id}
            images={product.images}
            configured={getCloudinaryConfig() !== null}
          />
        </FormSection>
      </div>
      {/* La key vuelve a montar el formulario con los datos guardados tras cada cambio. */}
      <ProductForm
        key={product.updatedAt.toISOString()}
        productId={product.id}
        currentStatus={product.status}
        imageCount={product.images.length}
        defaultValues={product.values}
        {...options}
      />
    </>
  );
}
