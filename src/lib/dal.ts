import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";

// Data Access Layer: único lugar donde se lee la sesión.
// proxy.ts solo hace un chequeo optimista de la cookie; la verificación real es esta.

export type Role = "OWNER" | "EDITOR";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Usuario de la sesión actual o null. Se deduplica dentro del mismo request. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "OWNER" ? "OWNER" : "EDITOR" };
});

/** Para páginas del admin: redirige al login si no hay sesión. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

type ActionError = Extract<ActionResult, { ok: false }>;

/**
 * Para Server Actions: devuelve el usuario, o un error 401/403 que la acción retorna tal cual.
 * Las acciones nunca confían en la UI: siempre verifican aquí.
 */
export async function authorizeAction(
  roles: Role[] = ["OWNER", "EDITOR"],
): Promise<{ ok: true; user: AdminUser } | ActionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  if (!roles.includes(user.role)) {
    return { ok: false, status: 403, error: "No tienes permiso para esta acción." };
  }
  return { ok: true, user };
}
