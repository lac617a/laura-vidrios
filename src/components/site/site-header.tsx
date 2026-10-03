import Link from "next/link";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { SiteNav } from "@/components/site/site-nav";
import { getSettings } from "@/lib/settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export async function SiteHeader() {
  const { businessName, whatsappNumber, logoUrl } = await getSettings();
  const whatsappHref = whatsappNumber
    ? buildWhatsappUrl(whatsappNumber, "Hola, quiero información sobre sus espejos.")
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {logoUrl && (
            <CloudinaryImage
              src={logoUrl}
              alt=""
              width={80}
              height={40}
              priority
              className="h-9 w-auto shrink-0 object-contain"
            />
          )}
          <span className="truncate font-heading text-2xl font-semibold">{businessName}</span>
        </Link>
        <SiteNav businessName={businessName} whatsappHref={whatsappHref} />
      </div>
    </header>
  );
}
