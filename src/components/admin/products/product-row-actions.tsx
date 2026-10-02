"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  StarOffIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  duplicateProduct,
  setProductFeatured,
  setProductStatus,
} from "@/app/admin/(panel)/productos/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductStatus } from "@/generated/prisma/enums";
import { useAdminAction } from "@/hooks/use-admin-action";

type RowProduct = { id: string; name: string; status: ProductStatus; isFeatured: boolean };

export function ProductRowActions({ product }: { product: RowProduct }) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const archived = product.status === "ARCHIVED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label={`Acciones para ${product.name}`}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem render={<Link href={`/admin/productos/${product.id}`} />}>
            <PencilIcon aria-hidden />
            Editar
          </DropdownMenuItem>

          {!archived && (
            <DropdownMenuItem
              onClick={() =>
                run(
                  () =>
                    setProductStatus(
                      product.id,
                      product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                    ),
                  {
                    success:
                      product.status === "PUBLISHED"
                        ? "Pasó a borrador: ya no se ve en la web."
                        : "Publicado.",
                  },
                )
              }
            >
              {product.status === "PUBLISHED" ? (
                <>
                  <EyeOffIcon aria-hidden />
                  Pasar a borrador
                </>
              ) : (
                <>
                  <EyeIcon aria-hidden />
                  Publicar
                </>
              )}
            </DropdownMenuItem>
          )}

          {!archived && (
            <DropdownMenuItem
              onClick={() =>
                run(() => setProductFeatured(product.id, !product.isFeatured), {
                  success: product.isFeatured
                    ? "Ya no está destacado."
                    : "Destacado en la portada.",
                })
              }
            >
              {product.isFeatured ? (
                <>
                  <StarOffIcon aria-hidden />
                  Quitar de destacados
                </>
              ) : (
                <>
                  <StarIcon aria-hidden />
                  Destacar
                </>
              )}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() =>
              run(() => duplicateProduct(product.id), {
                onSuccess: (result) => {
                  router.push(`/admin/productos/${result.data.id}`);
                },
                success: "Copia creada como borrador.",
              })
            }
          >
            <CopyIcon aria-hidden />
            Duplicar
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {archived ? (
            <DropdownMenuItem
              onClick={() =>
                run(() => setProductStatus(product.id, "DRAFT"), {
                  success: "Restaurado como borrador.",
                })
              }
            >
              <ArchiveRestoreIcon aria-hidden />
              Restaurar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmArchive(true)}>
              <ArchiveIcon aria-hidden />
              Archivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar «{product.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de verse en el catálogo. Los enlaces ya compartidos mostrarán «Este modelo ya no
              está disponible». Puedes restaurarlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmArchive(false);
                run(() => setProductStatus(product.id, "ARCHIVED"), { success: "Archivado." });
              }}
            >
              Archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
