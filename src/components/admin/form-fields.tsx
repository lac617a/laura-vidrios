"use client";

import type { ComponentProps } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Campos conectados a react-hook-form (usar dentro de <FormProvider>).

export function fieldId(name: string) {
  return `field-${name.replaceAll(".", "-")}`;
}

type TextFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  description?: string;
  multiline?: boolean;
} & Pick<
  ComponentProps<"input">,
  "type" | "placeholder" | "inputMode" | "autoComplete" | "className" | "list"
> &
  Pick<ComponentProps<"textarea">, "rows">;

export function TextField<T extends FieldValues>({
  name,
  label,
  description,
  multiline,
  rows,
  type,
  ...props
}: TextFieldProps<T>) {
  const { register, getFieldState, formState } = useFormContext<T>();
  const { error } = getFieldState(name, formState);
  const id = fieldId(name);
  const field = register(name, { valueAsNumber: type === "number" });

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          rows={rows}
          placeholder={props.placeholder}
          aria-invalid={Boolean(error)}
          {...field}
        />
      ) : (
        <Input id={id} type={type ?? "text"} aria-invalid={Boolean(error)} {...props} {...field} />
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}

export function SwitchField<T extends FieldValues>({
  name,
  label,
  description,
}: {
  name: Path<T>;
  label: string;
  description?: string;
}) {
  const { control } = useFormContext<T>();
  const id = fieldId(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </FieldContent>
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  );
}
