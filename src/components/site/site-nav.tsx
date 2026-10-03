"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useId, useRef } from "react";

import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/espejos", label: "Catálogo" },
  { href: "/a-la-medida", label: "A la medida" },
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

      <MobileMenu pathname={pathname} businessName={businessName} />
    </div>
  );
}

/**
 * Menú del celular con <dialog> nativo: foco atrapado, Esc y fondo inerte sin librerías (el
 * Sheet de Base UI sumaba ~35 KB de JavaScript a todas las páginas públicas).
 */
function MobileMenu({ pathname, businessName }: { pathname: string | null; businessName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        onClick={() => {
          dialogRef.current?.showModal();
          document.documentElement.style.overflow = "hidden";
        }}
        className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
      >
        <MenuIcon className="size-5" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => document.documentElement.style.removeProperty("overflow")}
        // Un clic en el fondo oscuro llega al <dialog> mismo: cierra.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-72 max-w-[85vw] animate-in bg-background p-0 text-foreground shadow-2xl duration-300 slide-in-from-right backdrop:bg-black/40 motion-reduce:animate-none md:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 p-4">
            <p id={titleId} className="truncate font-heading text-2xl font-semibold">
              {businessName}
            </p>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={close}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <XIcon className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Principal" className="flex flex-col px-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
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
        </div>
      </dialog>
    </>
  );
}
