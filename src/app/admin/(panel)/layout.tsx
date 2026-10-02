import { Suspense } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/dal";
import { getSettings } from "@/lib/settings";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { businessName } = await getSettings();

  return (
    <SidebarProvider>
      <AdminSidebar
        businessName={businessName}
        userMenu={
          <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
            <CurrentUserMenu />
          </Suspense>
        }
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <span className="text-sm text-muted-foreground">Panel de gestión</span>
        </header>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// La sesión se lee dentro de Suspense para no bloquear el resto del layout.
async function CurrentUserMenu() {
  const user = await requireAdmin();
  return <UserMenu name={user.name} email={user.email} role={user.role} />;
}
