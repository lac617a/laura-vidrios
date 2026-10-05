import { Suspense } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { SKIP_TARGET_ID, SkipLink } from "@/components/skip-link";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/dal";
import { countNewInquiries } from "@/lib/inquiry-admin";
import { getSettings } from "@/lib/settings";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { businessName } = await getSettings();

  return (
    <SidebarProvider>
      <SkipLink />
      <AdminSidebar
        businessName={businessName}
        userMenu={
          <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
            <CurrentUserMenu />
          </Suspense>
        }
        badges={{
          "/admin/consultas": (
            <Suspense fallback={null}>
              <NewInquiriesBadge />
            </Suspense>
          ),
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <span className="text-sm text-muted-foreground">Panel de gestión</span>
        </header>
        <div
          id={SKIP_TARGET_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none md:px-8 md:py-8"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Consultas sin atender (PRD S9): se actualiza con cada router.refresh() tras una acción. */
async function NewInquiriesBadge() {
  await requireAdmin();
  const count = await countNewInquiries();
  if (count === 0) return null;
  return (
    <SidebarMenuBadge
      aria-label={`${count} ${count === 1 ? "consulta nueva" : "consultas nuevas"}`}
      className="bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
    >
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}

// La sesión se lee dentro de Suspense para no bloquear el resto del layout.
async function CurrentUserMenu() {
  const user = await requireAdmin();
  return <UserMenu name={user.name} email={user.email} role={user.role} />;
}
