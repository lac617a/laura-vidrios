import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getCloudinaryConfig } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/dal";
import { getSettingsFresh, type SiteSettings } from "@/lib/settings";
import type { SettingsFormValues } from "@/lib/validations/settings";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos del negocio que se muestran en la web y en los mensajes de WhatsApp."
      />
      <Suspense fallback={<Skeleton className="h-[640px] w-full" />}>
        <SettingsLoader />
      </Suspense>
    </>
  );
}

async function SettingsLoader() {
  const user = await requireAdmin();
  if (user.role !== "OWNER") {
    return (
      <Alert>
        <LockIcon aria-hidden />
        <AlertTitle>Sin acceso</AlertTitle>
        <AlertDescription>
          Solo la cuenta con acceso total puede cambiar la configuración.
        </AlertDescription>
      </Alert>
    );
  }

  const settings = await getSettingsFresh();
  return (
    <SettingsForm
      defaultValues={toFormValues(settings)}
      imagesConfigured={getCloudinaryConfig() !== null}
    />
  );
}

function toFormValues(settings: SiteSettings): SettingsFormValues {
  return {
    businessName: settings.businessName,
    logoUrl: settings.logoUrl ?? "",
    address: settings.address ?? "",
    openingHours: settings.openingHours ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    facebookUrl: settings.facebookUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    whatsappNumber: settings.whatsappNumber,
    referencePrefix: settings.referencePrefix,
    shippingInfo: settings.shippingInfo ?? "",
    installationInfo: settings.installationInfo ?? "",
    coverageAreas: settings.coverageAreas.join("\n"),
    customMinCm: settings.customMinCm,
    customMaxCm: settings.customMaxCm,
    customFrameOptions: settings.customFrameOptions.join("\n"),
    privacyPolicy: settings.privacyPolicy ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    statsInstalled: settings.statsInstalled?.toString() ?? "",
    statsYears: settings.statsYears?.toString() ?? "",
  };
}
