"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { saveSettings } from "@/app/admin/(panel)/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/validations/settings";
import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from "@/lib/whatsapp";

export function SettingsForm({ defaultValues }: { defaultValues: SettingsFormValues }) {
  const router = useRouter();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
  });
  const { isDirty, isSubmitting } = form.formState;

  // Avisa antes de salir de la página con cambios sin guardar.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  async function onSubmit(values: SettingsFormValues) {
    const result = await saveSettings(values);

    if (result.ok) {
      toast.success("Configuración guardada. La web ya muestra los cambios.");
      form.reset({
        ...values,
        whatsappNumber: normalizeWhatsappNumber(values.whatsappNumber) ?? values.whatsappNumber,
      });
      return;
    }

    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) form.setError(field as keyof SettingsFormValues, { message: messages[0] });
    }
    toast.error(result.error);
    if (result.status === 401) router.replace("/admin/login?next=/admin/configuracion");
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
        <Section
          title="Negocio"
          description="Aparece en el encabezado, el pie de página y los buscadores."
        >
          <TextField name="businessName" label="Nombre del negocio" autoComplete="organization" />
          <TextField
            name="address"
            label="Dirección"
            placeholder="Calle 00 # 00-00, Barrio, Ciudad"
          />
          <TextField
            name="openingHours"
            label="Horario de atención"
            placeholder="Lunes a sábado, 8:00 a. m. – 6:00 p. m."
          />
        </Section>

        <Section
          title="WhatsApp"
          description="El número al que llegan todas las consultas de la web."
        >
          <WhatsappField />
        </Section>

        <Section
          title="Redes sociales"
          description="Opcionales. Se muestran como enlaces en el pie de página."
        >
          <TextField
            name="instagramUrl"
            label="Instagram"
            placeholder="https://instagram.com/…"
            type="url"
          />
          <TextField
            name="facebookUrl"
            label="Facebook"
            placeholder="https://facebook.com/…"
            type="url"
          />
          <TextField
            name="tiktokUrl"
            label="TikTok"
            placeholder="https://tiktok.com/@…"
            type="url"
          />
        </Section>

        <Section
          title="Referencias"
          description="Prefijo de las referencias de producto, por ejemplo ESP-0001."
        >
          <TextField
            name="referencePrefix"
            label="Prefijo"
            className="max-w-32 uppercase"
            description="Solo afecta a los productos nuevos; las referencias existentes no cambian."
          />
        </Section>

        <Section
          title="Envíos e instalación"
          description="Se muestran en la sección de servicios de la web."
        >
          <TextField name="shippingInfo" label="Información de envíos" multiline rows={3} />
          <TextField
            name="installationInfo"
            label="Información de instalación"
            multiline
            rows={3}
          />
          <TextField
            name="coverageAreas"
            label="Ciudades o zonas de cobertura"
            multiline
            rows={4}
            placeholder={"Bogotá\nChía\nSoacha"}
            description="Una por línea."
          />
        </Section>

        <Section
          title="Espejos a la medida"
          description="Límites y opciones del formulario «A la medida»."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="customMinCm"
              label="Medida mínima (cm)"
              type="number"
              inputMode="numeric"
            />
            <TextField
              name="customMaxCm"
              label="Medida máxima (cm)"
              type="number"
              inputMode="numeric"
            />
          </div>
          <TextField
            name="customFrameOptions"
            label="Marcos y acabados disponibles"
            multiline
            rows={5}
            placeholder={"Sin marco\nBiselado\nAluminio negro"}
            description="Una opción por línea."
          />
        </Section>

        <Section
          title="Política de datos"
          description="Texto de la página de tratamiento de datos personales (Ley 1581 de 2012)."
        >
          <TextField
            name="privacyPolicy"
            label="Política de tratamiento de datos"
            multiline
            rows={8}
          />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          {isDirty && (
            <>
              <span className="mr-auto text-sm text-muted-foreground">
                Tienes cambios sin guardar.
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Descartar
              </Button>
            </>
          )}
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b pb-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <FieldGroup>{children}</FieldGroup>
    </section>
  );
}

type TextFieldProps = {
  name: keyof SettingsFormValues;
  label: string;
  description?: string;
  multiline?: boolean;
} & Pick<
  ComponentProps<"input">,
  "type" | "placeholder" | "inputMode" | "autoComplete" | "className"
> &
  Pick<ComponentProps<"textarea">, "rows">;

function TextField({ name, label, description, multiline, rows, type, ...props }: TextFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();
  const error = errors[name];
  const id = `settings-${name}`;
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

function WhatsappField() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();
  const value = useWatch({ control, name: "whatsappNumber" });
  const normalized = normalizeWhatsappNumber(value ?? "");
  const error = errors.whatsappNumber;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="settings-whatsappNumber">Número de WhatsApp</FieldLabel>
      <div className="flex gap-2">
        <Input
          id="settings-whatsappNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="300 123 4567"
          aria-invalid={Boolean(error)}
          {...register("whatsappNumber")}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!normalized}
          onClick={() =>
            normalized &&
            window.open(
              buildWhatsappUrl(normalized, "Hola, esta es una prueba desde el panel."),
              "_blank",
              "noopener",
            )
          }
        >
          Probar
          <ExternalLinkIcon aria-hidden />
        </Button>
      </div>
      <FieldDescription>
        {normalized
          ? `Los clientes escribirán a ${formatWhatsappNumber(normalized)}.`
          : "Celular colombiano de 10 dígitos. Puedes escribirlo con o sin +57."}
      </FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}
