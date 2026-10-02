"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionFailure } from "@/lib/action-result";

/** Cualquier ActionResult, con o sin datos. */
type AnyActionResult = { ok: true } | ActionFailure;
type SuccessOf<R> = Extract<R, { ok: true }>;

/**
 * Ejecuta una Server Action del admin: muestra el error en un toast, manda al login si la
 * sesión expiró y refresca la página al terminar bien.
 */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<R extends AnyActionResult>(
    action: () => Promise<R>,
    options: { success?: string; onSuccess?: (result: SuccessOf<R>) => void } = {},
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        if (result.status === 401) router.replace("/admin/login");
        return;
      }
      if (options.success) toast.success(options.success);
      options.onSuccess?.(result as SuccessOf<R>);
      router.refresh();
    });
  }

  return { run, pending };
}
