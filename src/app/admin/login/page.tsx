import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/50 px-4 py-12">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            <h1>Panel de gestión</h1>
          </CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-52 w-full" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");
  return null;
}
