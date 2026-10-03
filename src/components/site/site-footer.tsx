import { ClockIcon, MapPinIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";

import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { getSettings } from "@/lib/settings";
import { joinList } from "@/lib/text";
import { formatWhatsappNumber } from "@/lib/whatsapp";

/** Año del copyright: cacheado un día (con Cache Components, `new Date()` va en un caché). */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const EXPLORE = [
  { href: "/espejos", label: "Catálogo" },
  { href: "/a-la-medida", label: "Espejos a la medida" },
  { href: "/politica-de-datos", label: "Política de datos" },
];

/** Footer del sitio público (PRD RF-L07). */
export async function SiteFooter() {
  const [settings, year] = await Promise.all([getSettings(), currentYear()]);
  const socials = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Facebook", href: settings.facebookUrl },
    { label: "TikTok", href: settings.tiktokUrl },
  ].filter((social): social is { label: string; href: string } => Boolean(social.href));

  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl font-semibold">{settings.businessName}</p>
          <p className="mt-2 max-w-xs text-muted-foreground">
            Espejos de todo tipo y a la medida, con envío e instalación.
          </p>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            {settings.address && (
              <li className="flex gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                {settings.address}
              </li>
            )}
            {settings.openingHours && (
              <li className="flex gap-2">
                <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                {settings.openingHours}
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Explora">
          <h2 className="font-semibold">Explora</h2>
          <ul className="mt-3 space-y-2">
            {EXPLORE.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-semibold">Contacto</h2>
          <ul className="mt-3 space-y-2">
            {settings.whatsappNumber && (
              <li>
                <GeneralWhatsappLink
                  whatsappNumber={settings.whatsappNumber}
                  channel="footer"
                  className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <WhatsappIcon className="size-4 text-whatsapp" />
                  {formatWhatsappNumber(settings.whatsappNumber)}
                </GeneralWhatsappLink>
              </li>
            )}
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">Servicios</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>Fabricación a la medida</li>
            <li>Envío a tu ciudad</li>
            <li>
              Instalación
              {settings.coverageAreas.length > 0 && ` en ${joinList(settings.coverageAreas)}`}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground">
          <p>
            © {year} {settings.businessName}. Precios en pesos colombianos (COP), IVA incluido.
          </p>
          <Link href="/politica-de-datos" className="underline-offset-4 hover:underline">
            Tratamiento de datos personales
          </Link>
        </div>
      </div>
    </footer>
  );
}
