import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsappFloat } from "@/components/site/whatsapp-float";
import { SKIP_TARGET_ID, SkipLink } from "@/components/skip-link";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getSettings();
  return {
    title: { default: businessName, template: `%s · ${businessName}` },
    openGraph: { siteName: businessName, locale: "es_CO", type: "website" },
  };
}

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <NuqsAdapter>
      <SkipLink />
      <SiteHeader />
      <div id={SKIP_TARGET_ID} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </div>
      <SiteFooter />
      <FloatingWhatsapp />
      {/* Solo el sitio público: el admin no se mide. */}
      <Analytics />
    </NuqsAdapter>
  );
}

async function FloatingWhatsapp() {
  const { whatsappNumber } = await getSettings();
  return whatsappNumber ? <WhatsappFloat whatsappNumber={whatsappNumber} /> : null;
}
