import type { Metadata } from "next";

import { CustomOrderForm } from "@/components/custom-order/custom-order-form";
import { getSettings } from "@/lib/settings";

const description =
  "Diseña tu espejo: forma, medidas, marco y luz LED. Te enviamos la cotización por WhatsApp, con envío e instalación.";

export const metadata: Metadata = {
  title: "Espejos a la medida",
  description,
  alternates: { canonical: "/a-la-medida" },
  openGraph: { title: "Espejos a la medida", description, url: "/a-la-medida" },
};

export default function CustomOrderPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:pt-12">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">A la medida</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold text-balance sm:text-5xl">
          Diseña tu espejo
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cuéntanos la forma, las medidas y el acabado que quieres. En cinco pasos te armamos el
          mensaje para cotizarlo por WhatsApp.
        </p>
      </header>
      <CustomOrder />
    </main>
  );
}

async function CustomOrder() {
  // Configuración cacheada ("use cache"): límites de medida, marcos y textos de servicios.
  const settings = await getSettings();
  return (
    <CustomOrderForm
      context={{
        whatsappNumber: settings.whatsappNumber,
        minCm: settings.customMinCm,
        maxCm: settings.customMaxCm,
        frameOptions: settings.customFrameOptions,
        shippingInfo: settings.shippingInfo,
        installationInfo: settings.installationInfo,
        coverageAreas: settings.coverageAreas,
      }}
    />
  );
}
