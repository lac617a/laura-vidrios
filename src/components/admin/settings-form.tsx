"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { saveSettings } from "@/app/admin/(panel)/configuracion/actions";
import { TextField as BaseTextField } from "@/components/admin/form-fields";
import { FormSaveBar, FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/validations/settings";
import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from "@/lib/whatsapp";

const TextField = BaseTextField<SettingsFormValues>;

export function SettingsForm({ defaultValues }: { defaultValues: SettingsFormValues }) {
  const router = useRouter();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
  });
  const { isDirty, isSubmitting } = form.formState;

  useUnsavedChangesWarning(isDirty);

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
        <FormSection
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
        </FormSection>

        <FormSection
          title="WhatsApp"
          description="El número al que llegan todas las consultas de la web."
        >
          <WhatsappField />
        </FormSection>

        <FormSection
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
        </FormSection>

        <FormSection
          title="Referencias"
          description="Prefijo de las referencias de producto, por ejemplo ESP-0001."
        >
          <TextField
            name="referencePrefix"
            label="Prefijo"
            className="max-w-32 uppercase"
            description="Solo afecta a los productos nuevos; las referencias existentes no cambian."
          />
        </FormSection>

        <FormSection
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
        </FormSection>

        <FormSection
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
        </FormSection>

        <FormSection
          title="Política de datos"
          description="Texto de la página de tratamiento de datos personales (Ley 1581 de 2012)."
        >
          <TextField
            name="privacyPolicy"
            label="Política de tratamiento de datos"
            multiline
            rows={8}
          />
        </FormSection>

        <FormSaveBar notice={isDirty ? "Tienes cambios sin guardar." : undefined}>
          {isDirty && (
            <>
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
        </FormSaveBar>
      </form>
    </FormProvider>
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
