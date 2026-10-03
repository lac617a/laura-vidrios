"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { saveCategory } from "@/app/admin/(panel)/categorias/actions";
import { showInvalid } from "@/components/admin/form-fields";
import { SingleImageField } from "@/components/admin/images/single-image-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategoryRow } from "@/lib/catalog-admin-queries";
import { slugify } from "@/lib/text";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/category";

export function CategoryDialog({
  open,
  category,
  imagesConfigured,
  onOpenChange,
}: {
  open: boolean;
  category: AdminCategoryRow | null;
  imagesConfigured: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      imageUrl: category?.imageUrl ?? "",
      isActive: category?.isActive ?? true,
    },
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });
  const slugPreview = slug || slugify(name ?? "");

  async function onSubmit(values: CategoryFormValues) {
    const result = await saveCategory(category?.id ?? null, values);
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0])
          form.setError(field as keyof CategoryFormValues, { message: messages[0] });
      }
      toast.error(result.error);
      if (result.status === 401) router.replace("/admin/login");
      return;
    }
    toast.success(category ? "Categoría actualizada." : "Categoría creada.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit, showInvalid)} noValidate>
          <DialogHeader>
            <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            <DialogDescription>Los clientes la verán como filtro en el catálogo.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-6">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
              <Input
                id="category-name"
                placeholder="Baño"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.slug)}>
              <FieldLabel htmlFor="category-slug">Enlace</FieldLabel>
              <Input
                id="category-slug"
                placeholder={slugify(name ?? "") || "bano"}
                aria-invalid={Boolean(errors.slug)}
                {...register("slug")}
              />
              <FieldDescription>
                {slugPreview ? `/espejos/categoria/${slugPreview}` : "Se genera desde el nombre."}
              </FieldDescription>
              <FieldError errors={[errors.slug]} />
            </Field>
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="category-description">Descripción (opcional)</FieldLabel>
              <Textarea id="category-description" rows={3} {...register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="category-image">Imagen (opcional)</FieldLabel>
                  <SingleImageField
                    id="category-image"
                    value={field.value}
                    onChange={field.onChange}
                    target={{ kind: "category" }}
                    configured={imagesConfigured}
                    alt={name || "Categoría"}
                    previewClassName="aspect-4/5 h-28 w-auto"
                  />
                  <FieldDescription>Se muestra en la página de inicio.</FieldDescription>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="category-active">Visible en la web</FieldLabel>
                    <FieldDescription>
                      Si la ocultas, sus productos siguen existiendo.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="category-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
