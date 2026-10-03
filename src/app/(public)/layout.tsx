import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
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
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </NuqsAdapter>
  );
}
