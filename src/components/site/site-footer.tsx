import { getSettings } from "@/lib/settings";
import { formatWhatsappNumber } from "@/lib/whatsapp";

// Footer provisional (Sprint 1). El definitivo llega con la landing (S8).
export async function SiteFooter() {
  const settings = await getSettings();
  const socials = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Facebook", href: settings.facebookUrl },
    { label: "TikTok", href: settings.tiktokUrl },
  ].filter((social): social is { label: string; href: string } => Boolean(social.href));

  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-semibold text-foreground">
            {settings.businessName}
          </p>
          {settings.address && <p className="mt-2">{settings.address}</p>}
        </div>
        <div className="space-y-1">
          {settings.openingHours && <p>{settings.openingHours}</p>}
          {settings.whatsappNumber && (
            <p>WhatsApp: {formatWhatsappNumber(settings.whatsappNumber)}</p>
          )}
        </div>
        {socials.length > 0 && (
          <ul className="flex gap-4 sm:justify-end">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
