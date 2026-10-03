"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { cn } from "@/lib/utils";

// Las secciones nuevas (A la medida, S7) se agregan aquí.
const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/espejos", label: "Catálogo" },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Navegación pública: enlaces en desktop y panel lateral en el celular. */
export function SiteNav({
  businessName,
  whatsappNumber,
}: {
  businessName: string;
  whatsappNumber: string;
}) {
  return (
    // usePathname es dato de URL: en Suspense, con fallback sin enlace activo.
    <Suspense
      fallback={
        <NavContent pathname={null} businessName={businessName} whatsappNumber={whatsappNumber} />
      }
    >
      <ActiveNav businessName={businessName} whatsappNumber={whatsappNumber} />
    </Suspense>
  );
}

function ActiveNav(props: { businessName: string; whatsappNumber: string }) {
  return <NavContent pathname={usePathname()} {...props} />;
}

function NavContent({
  pathname,
  businessName,
  whatsappNumber,
}: {
  pathname: string | null;
  businessName: string;
  whatsappNumber: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors hover:text-foreground",
              isActive(pathname, link.href)
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {whatsappNumber && (
        <GeneralWhatsappLink
          whatsappNumber={whatsappNumber}
          channel="header"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          <WhatsappIcon className="size-4" />
          <span>WhatsApp</span>
        </GeneralWhatsappLink>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" />
          }
        >
          <MenuIcon aria-hidden />
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="font-heading text-2xl">{businessName}</SheetTitle>
          </SheetHeader>
          <nav aria-label="Principal" className="flex flex-col px-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-base",
                  isActive(pathname, link.href) ? "bg-secondary font-medium" : "hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
