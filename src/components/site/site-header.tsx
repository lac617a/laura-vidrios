import { MessageCircleIcon } from "lucide-react";
import Link from "next/link";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { getSettings } from "@/lib/settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

// Header provisional (Sprint 1). El definitivo, con navegación y animaciones, llega en S4/S8.
export async function SiteHeader() {
  const { businessName, whatsappNumber, logoUrl } = await getSettings();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
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
        {whatsappNumber && (
          <a
            href={buildWhatsappUrl(whatsappNumber, "Hola, quiero información sobre sus espejos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <MessageCircleIcon className="size-4" aria-hidden />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </header>
  );
}
