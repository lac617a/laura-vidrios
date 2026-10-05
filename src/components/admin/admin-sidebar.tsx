"use client";

import {
  FolderTreeIcon,
  LayoutDashboardIcon,
  MessagesSquareIcon,
  PackageIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };

// Las secciones marcadas `soon` se habilitan en sus sprints (ver ROADMAP.md).
const NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboardIcon },
  { href: "/admin/consultas", label: "Consultas", icon: MessagesSquareIcon },
  { href: "/admin/productos", label: "Productos", icon: PackageIcon },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTreeIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];

/** Contenido extra junto a una sección (ej. el número de consultas nuevas), por href. */
export type NavBadges = Partial<Record<string, ReactNode>>;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebar({
  businessName,
  userMenu,
  badges = {},
}: {
  businessName: string;
  userMenu: ReactNode;
  badges?: NavBadges;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-2">
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-full border border-sidebar-border bg-linear-to-br from-white via-secondary to-accent"
          />
          <span className="truncate font-heading text-lg font-semibold group-data-[collapsible=icon]:hidden">
            {businessName}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* usePathname es dato de URL: va en Suspense para no bloquear el prerender. */}
            <Suspense fallback={<NavMenu pathname={null} badges={badges} />}>
              <ActiveNavMenu badges={badges} />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{userMenu}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ActiveNavMenu({ badges }: { badges: NavBadges }) {
  return <NavMenu pathname={usePathname()} badges={badges} />;
}

/** Menú de secciones; sin pathname (fallback) no marca ninguna como activa. */
function NavMenu({ pathname, badges }: { pathname: string | null; badges: NavBadges }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV.map(({ href, label, icon: Icon, soon }) => (
        <SidebarMenuItem key={href}>
          {soon ? (
            <>
              <SidebarMenuButton disabled tooltip={`${label} (pronto)`}>
                <Icon aria-hidden />
                <span>{label}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>Pronto</SidebarMenuBadge>
            </>
          ) : (
            <>
              <SidebarMenuButton
                isActive={pathname !== null && isActive(pathname, href)}
                tooltip={label}
                render={<Link href={href} onClick={() => setOpenMobile(false)} />}
              >
                <Icon aria-hidden />
                <span>{label}</span>
              </SidebarMenuButton>
              {badges[href]}
            </>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
