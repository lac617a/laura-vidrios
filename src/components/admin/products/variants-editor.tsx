"use client";

import { PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { fieldId } from "@/components/admin/form-fields";
import { PriceInput } from "@/components/admin/price-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import { hasEqualSides } from "@/lib/format";
import { cn } from "@/lib/utils";
import { emptyVariant, type ProductFormValues } from "@/lib/validations/product";

/** Filas editables de medidas: ancho × alto (o diámetro/lado), precio, disponibilidad. */
export function VariantsEditor() {
  const { control, register, setValue, getValues, getFieldState, formState } =
    useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const shape = useWatch({ control, name: "shape" });
  const variants = useWatch({ control, name: "variants" });
  const equalSides = hasEqualSides(shape);
  const sideLabel = shape === "ROUND" ? "Diámetro (cm)" : "Lado (cm)";
  const arrayError = getFieldState("variants", formState).error;

  // En redondos y cuadrados el alto copia al ancho (no es estado de React: es el form).
  useEffect(() => {
    if (!equalSides) return;
    getValues("variants").forEach((variant, index) =>
      setValue(`variants.${index}.heightCm`, variant.widthCm),
    );
  }, [equalSides, getValues, setValue]);

  function makeDefault(index: number) {
    getValues("variants").forEach((_, i) =>
      setValue(`variants.${i}.isDefault`, i === index, { shouldDirty: true }),
    );
  }

  function removeRow(index: number) {
    const wasDefault = getValues(`variants.${index}.isDefault`);
    remove(index);
    if (wasDefault && getValues("variants").length > 0) makeDefault(0);
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Sin medidas. Agrega al menos una para poder publicar.
        </p>
      )}

      {fields.map((field, index) => {
        const isDefault = variants?.[index]?.isDefault ?? false;
        const widthError = getFieldState(`variants.${index}.widthCm`, formState).error;
        const heightError = getFieldState(`variants.${index}.heightCm`, formState).error;
        const priceError = getFieldState(`variants.${index}.price`, formState).error;

        return (
          <fieldset
            key={field.id}
            className={cn(
              "grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-[6rem_6rem_minmax(0,1fr)_10rem_auto]",
              equalSides && "sm:grid-cols-[6rem_minmax(0,1fr)_10rem_auto]",
              isDefault && "border-primary/40 bg-secondary/40",
            )}
          >
            <legend className="sr-only">Medida {index + 1}</legend>

            <Field data-invalid={Boolean(widthError)}>
              <FieldLabel htmlFor={fieldId(`variants.${index}.widthCm`)}>
                {equalSides ? sideLabel : "Ancho (cm)"}
              </FieldLabel>
              <Input
                id={fieldId(`variants.${index}.widthCm`)}
                type="number"
                inputMode="numeric"
                min={1}
                aria-invalid={Boolean(widthError)}
                {...register(`variants.${index}.widthCm`, {
                  valueAsNumber: true,
                  onChange: (event) => {
                    if (equalSides) {
                      setValue(`variants.${index}.heightCm`, event.target.valueAsNumber);
                    }
                  },
                })}
              />
            </Field>

            {!equalSides && (
              <Field data-invalid={Boolean(heightError)}>
                <FieldLabel htmlFor={fieldId(`variants.${index}.heightCm`)}>Alto (cm)</FieldLabel>
                <Input
                  id={fieldId(`variants.${index}.heightCm`)}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-invalid={Boolean(heightError)}
                  {...register(`variants.${index}.heightCm`, { valueAsNumber: true })}
                />
              </Field>
            )}

            <Field data-invalid={Boolean(priceError)} className="col-span-2 sm:col-span-1">
              <FieldLabel htmlFor={fieldId(`variants.${index}.price`)}>Precio (COP)</FieldLabel>
              <Controller
                control={control}
                name={`variants.${index}.price`}
                render={({ field: price }) => (
                  <PriceInput
                    id={fieldId(`variants.${index}.price`)}
                    placeholder="Sin precio"
                    value={price.value}
                    onChange={price.onChange}
                    onBlur={price.onBlur}
                    aria-invalid={Boolean(priceError)}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={fieldId(`variants.${index}.availability`)}>
                Disponibilidad
              </FieldLabel>
              <Controller
                control={control}
                name={`variants.${index}.availability`}
                render={({ field: availability }) => (
                  <Select
                    items={AVAILABILITY_LABELS}
                    value={availability.value}
                    onValueChange={(value) => value && availability.onChange(value)}
                  >
                    <SelectTrigger
                      id={fieldId(`variants.${index}.availability`)}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className="flex items-end justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={isDefault}
                aria-label={isDefault ? "Medida principal" : "Usar como medida principal"}
                title={isDefault ? "Medida principal" : "Usar como medida principal"}
                onClick={() => makeDefault(index)}
              >
                <StarIcon
                  aria-hidden
                  className={cn(isDefault && "fill-amber-400 text-amber-500")}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar medida ${index + 1}`}
                onClick={() => removeRow(index)}
              >
                <Trash2Icon aria-hidden />
              </Button>
            </div>

            <FieldError
              className="col-span-full -mt-1"
              errors={[widthError, heightError, priceError]}
            />
          </fieldset>
        );
      })}

      {arrayError?.message && (
        <p role="alert" className="text-sm text-destructive">
          {arrayError.message}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ ...emptyVariant(), isDefault: fields.length === 0 })}
      >
        <PlusIcon aria-hidden />
        Agregar medida
      </Button>
      <p className="text-xs text-muted-foreground">
        La estrella marca la medida que se muestra primero. Deja el precio vacío para mostrar «A
        consultar».
      </p>
    </div>
  );
}
