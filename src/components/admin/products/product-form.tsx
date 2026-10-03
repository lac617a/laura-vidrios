"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArchiveIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createProduct, updateProduct } from "@/app/admin/(panel)/productos/actions";
import {
  SwitchField,
  TextField as BaseTextField,
  fieldId,
  showInvalid,
} from "@/components/admin/form-fields";
import { FormSaveBar, FormSection } from "@/components/admin/form-section";
import { VariantsEditor } from "@/components/admin/products/variants-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ActionFailure } from "@/lib/action-result";
import { SHAPE_LABELS, SHAPES } from "@/lib/catalog";
import type { ProductStatus } from "@/generated/prisma/enums";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";
import { slugify } from "@/lib/text";
import { cn } from "@/lib/utils";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";

const TextField = BaseTextField<ProductFormValues>;
const Switch = SwitchField<ProductFormValues>;

type CategoryOption = { id: string; name: string; isActive: boolean };

export function ProductForm({
  productId,
  currentStatus,
  imageCount = 0,
  defaultValues,
  categories,
  frameSuggestions,
  nextReference,
}: {
  /** Ausente al crear. */
  productId?: string;
  currentStatus?: ProductStatus;
  /** Fotos actuales: sin fotos no se puede publicar. */
  imageCount?: number;
  defaultValues: ProductFormValues;
  categories: CategoryOption[];
  frameSuggestions: string[];
  nextReference: string;
}) {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });
  const { control } = form;
  const { isDirty, isSubmitting } = form.formState;
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });
  const isEditing = Boolean(productId);
  const archived = currentStatus === "ARCHIVED";
  const slugPreview = slug || slugify(name ?? "");
  const canPublish = imageCount > 0 || currentStatus === "PUBLISHED";

  useUnsavedChangesWarning(isDirty && !isSubmitting);

  const categoryItems = Object.fromEntries(
    categories.map((category) => [
      category.id,
      category.isActive ? category.name : `${category.name} (oculta)`,
    ]),
  );

  function showFailure(result: ActionFailure) {
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) form.setError(field as keyof ProductFormValues, { message: messages[0] });
    }
    toast.error(result.error);
    if (result.status === 401) router.replace("/admin/login");
  }

  async function onSubmit(values: ProductFormValues) {
    if (!productId) {
      const result = await createProduct(values);
      if (!result.ok) return showFailure(result);
      toast.success(`Producto creado: ${result.data.reference}`);
      form.reset(values); // evita el aviso de cambios sin guardar al navegar
      router.replace(`/admin/productos/${result.data.id}`);
      return;
    }

    const result = await updateProduct(productId, values);
    if (!result.ok) return showFailure(result);
    toast.success("Cambios guardados.");
    // La página se vuelve a montar con los datos guardados (ver key en la página).
    form.reset(values);
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, showInvalid)} noValidate className="space-y-8">
        {archived && (
          <Alert>
            <ArchiveIcon aria-hidden />
            <AlertTitle>Producto archivado</AlertTitle>
            <AlertDescription>
              No se ve en el catálogo. Puedes editarlo; para volver a mostrarlo, restáuralo desde el
              listado de productos.
            </AlertDescription>
          </Alert>
        )}

        <FormSection title="Información" description="Lo primero que ve el cliente.">
          <TextField name="name" label="Nombre" placeholder="Espejo redondo Luna LED" />

          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Field data-invalid={Boolean(fieldState.error)}>
                <FieldLabel htmlFor={fieldId("categoryId")}>Categoría</FieldLabel>
                <Select
                  items={categoryItems}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id={fieldId("categoryId")}
                    className="w-full sm:w-72"
                    aria-invalid={Boolean(fieldState.error)}
                  >
                    <SelectValue placeholder="Elige una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {categoryItems[category.id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <FieldDescription>
                    Primero crea una categoría en{" "}
                    <Link href="/admin/categorias" className="underline">
                      Categorías
                    </Link>
                    .
                  </FieldDescription>
                )}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="shape"
            render={({ field }) => (
              <Field>
                <FieldLabel id="shape-label">Forma</FieldLabel>
                <ToggleGroup
                  aria-labelledby="shape-label"
                  variant="outline"
                  spacing={2}
                  className="flex-wrap"
                  value={[field.value]}
                  onValueChange={(values) => values[0] && field.onChange(values[0])}
                >
                  {SHAPES.map((shape) => (
                    <ToggleGroupItem key={shape} value={shape} className="px-3">
                      {SHAPE_LABELS[shape]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            )}
          />

          <TextField
            name="description"
            label="Descripción"
            multiline
            rows={4}
            placeholder="Materiales, acabado, para qué espacio es ideal…"
          />
        </FormSection>

        <FormSection
          title="Medidas y precios"
          description="Una fila por cada medida que vendes. Precios en pesos, con IVA incluido."
        >
          <VariantsEditor />
          <Switch
            name="showPrice"
            label="Mostrar precios en la web"
            description="Si lo apagas, el cliente ve «A consultar»."
          />
          <Switch
            name="allowCustomSize"
            label="Aceptar otra medida"
            description="El cliente puede pedir este modelo en una medida personalizada."
          />
        </FormSection>

        <FormSection title="Detalles" description="Ayudan a filtrar y a describir el espejo.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="frameMaterial"
              label="Marco o material"
              placeholder="Aluminio, madera, sin marco…"
              list="frame-suggestions"
            />
            <TextField name="frameColor" label="Color del marco" placeholder="Negro, dorado…" />
          </div>
          <datalist id="frame-suggestions">
            {frameSuggestions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <TextField name="style" label="Estilo" placeholder="Moderno, minimalista, vintage…" />
          <Switch name="hasLed" label="Con luz LED" />
        </FormSection>

        <FormSection title="Publicación" description="Cuándo y cómo aparece en la web.">
          {!archived && (
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel id="status-label">Estado</FieldLabel>
                  <RadioGroup
                    aria-labelledby="status-label"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="gap-3"
                  >
                    <label className="flex items-start gap-3">
                      <RadioGroupItem value="DRAFT" className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">Borrador</span>
                        <span className="block text-sm text-muted-foreground">
                          Solo se ve en el panel.
                        </span>
                      </span>
                    </label>
                    <label className={cn("flex items-start gap-3", !canPublish && "opacity-60")}>
                      <RadioGroupItem value="PUBLISHED" className="mt-0.5" disabled={!canPublish} />
                      <span>
                        <span className="block text-sm font-medium">Publicado</span>
                        <span className="block text-sm text-muted-foreground">
                          {canPublish
                            ? "Visible en el catálogo."
                            : isEditing
                              ? "Sube al menos una foto para poder publicarlo."
                              : "Podrás publicarlo después de crearlo y subir sus fotos."}
                        </span>
                      </span>
                    </label>
                  </RadioGroup>
                </Field>
              )}
            />
          )}
          <Switch
            name="isFeatured"
            label="Destacado"
            description="Aparece en la sección de destacados de la página de inicio."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="reference"
              label="Referencia"
              placeholder={nextReference}
              className="uppercase"
              description={
                isEditing
                  ? "El código que verás en los mensajes de WhatsApp."
                  : `Déjala vacía para usar ${nextReference}.`
              }
            />
            <TextField
              name="slug"
              label="Enlace"
              placeholder={slugify(name ?? "") || "espejo-redondo-luna"}
              description={
                isEditing
                  ? "Cambiarlo rompe los enlaces que ya compartiste."
                  : "Se genera desde el nombre."
              }
            />
          </div>
          {slugPreview && (
            <p className="text-sm text-muted-foreground">
              Dirección en la web:{" "}
              <span className="font-mono text-foreground">/espejos/{slugPreview}</span>
            </p>
          )}
        </FormSection>

        <FormSaveBar notice={isDirty ? "Tienes cambios sin guardar." : undefined}>
          <Button
            type="button"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/admin/productos" />}
          >
            Volver
          </Button>
          <Button type="submit" disabled={isSubmitting || (isEditing && !isDirty)}>
            {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
            {isEditing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </FormSaveBar>
      </form>
    </FormProvider>
  );
}
