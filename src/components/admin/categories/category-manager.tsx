"use client";

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { deleteCategory, moveCategory } from "@/app/admin/(panel)/categorias/actions";
import { CategoryDialog } from "@/components/admin/categories/category-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdminAction } from "@/hooks/use-admin-action";
import type { AdminCategoryRow } from "@/lib/catalog-admin-queries";

type Editing = { mode: "closed" } | { mode: "new" } | { mode: "edit"; category: AdminCategoryRow };

export function CategoryManager({ categories }: { categories: AdminCategoryRow[] }) {
  const [editing, setEditing] = useState<Editing>({ mode: "closed" });
  const { run, pending } = useAdminAction();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ mode: "new" })}>
          <PlusIcon aria-hidden />
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aún no hay categorías. Crea la primera (por ejemplo «Baño» o «Cuerpo entero»).
        </div>
      ) : (
        <ol className="divide-y rounded-xl border bg-card">
          {categories.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <div className="flex shrink-0 flex-col">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Subir ${category.name}`}
                  disabled={pending || index === 0}
                  onClick={() => run(() => moveCategory(category.id, "up"))}
                >
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Bajar ${category.name}`}
                  disabled={pending || index === categories.length - 1}
                  onClick={() => run(() => moveCategory(category.id, "down"))}
                >
                  <ArrowDownIcon aria-hidden />
                </Button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{category.name}</span>
                  {!category.isActive && <Badge variant="outline">Oculta</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  /{category.slug} · {category._count.products} producto(s)
                </p>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${category.name}`}
                  onClick={() => setEditing({ mode: "edit", category })}
                >
                  <PencilIcon aria-hidden />
                </Button>
                <DeleteCategoryButton
                  category={category}
                  disabled={pending}
                  onConfirm={() =>
                    run(() => deleteCategory(category.id), { success: "Categoría eliminada." })
                  }
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <CategoryDialog
        key={editing.mode === "edit" ? editing.category.id : editing.mode}
        open={editing.mode !== "closed"}
        category={editing.mode === "edit" ? editing.category : null}
        onOpenChange={(open) => !open && setEditing({ mode: "closed" })}
      />
    </>
  );
}

function DeleteCategoryButton({
  category,
  disabled,
  onConfirm,
}: {
  category: AdminCategoryRow;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const productCount = category._count.products;

  if (productCount > 0) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-flex">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label={`No se puede eliminar ${category.name}`}
              >
                <Trash2Icon aria-hidden />
              </Button>
            </span>
          }
        />
        <TooltipContent>
          Tiene {productCount} producto(s). Muévelos antes de eliminarla.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`Eliminar ${category.name}`}
          />
        }
      >
        <Trash2Icon aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar «{category.name}»?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
