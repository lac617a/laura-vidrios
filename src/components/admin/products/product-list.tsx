import { StarIcon } from "lucide-react";
import Link from "next/link";

import { ProductRowActions } from "@/components/admin/products/product-row-actions";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProductRow } from "@/lib/catalog-admin-queries";
import { formatPriceFrom, formatSizeRange } from "@/lib/format";

function summary(product: AdminProductRow) {
  return {
    sizes: formatSizeRange(product.variants, product.shape),
    price: formatPriceFrom(
      product.variants.map((variant) => variant.price),
      product.showPrice,
    ),
  };
}

function FeaturedStar({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <StarIcon className="size-3.5 shrink-0 fill-amber-400 text-amber-500" aria-label="Destacado" />
  );
}

/** Tabla en desktop y tarjetas en móvil. */
export function ProductList({ products }: { products: AdminProductRow[] }) {
  return (
    <>
      <ul className="divide-y rounded-xl border bg-card md:hidden">
        {products.map((product) => {
          const { sizes, price } = summary(product);
          return (
            <li key={product.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="flex items-center gap-1.5 font-medium"
                >
                  <span className="truncate">{product.name}</span>
                  <FeaturedStar show={product.isFeatured} />
                </Link>
                <p className="text-xs text-muted-foreground">
                  {product.reference} · {product.category.name}
                </p>
                <p className="mt-1 text-sm">{sizes}</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="tabular-nums">{price}</span>
                  <ProductStatusBadge status={product.status} />
                </div>
              </div>
              <ProductRowActions product={product} />
            </li>
          );
        })}
      </ul>

      <div className="hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Medidas</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const { sizes, price } = summary(product);
              return (
                <TableRow key={product.id}>
                  <TableCell className="max-w-72">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="flex items-center gap-1.5 font-medium hover:underline"
                    >
                      <span className="truncate">{product.name}</span>
                      <FeaturedStar show={product.isFeatured} />
                    </Link>
                    <span className="text-xs text-muted-foreground">{product.reference}</span>
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{sizes}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{price}</TableCell>
                  <TableCell>
                    <ProductStatusBadge status={product.status} />
                  </TableCell>
                  <TableCell>
                    <ProductRowActions product={product} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
