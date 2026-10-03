"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { SETTINGS_TAG } from "@/lib/cache-tags";
import { destroyImageAtUrl } from "@/lib/catalog-admin";
import { authorizeAction } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { settingsFormSchema, toSettingsData } from "@/lib/validations/settings";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  // Solo OWNER cambia la configuración del negocio (PRD §3).
  const authorization = await authorizeAction(["OWNER"]);
  if (!authorization.ok) return authorization;

  const parsed = settingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = toSettingsData(parsed.data);
  const previous = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { logoUrl: true, heroImageUrl: true },
  });
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  // El sitio público vuelve a leer la configuración en el próximo request.
  updateTag(SETTINGS_TAG);
  // El logo o la foto principal reemplazados ya no se usan: se borran de Cloudinary.
  if (previous?.logoUrl && previous.logoUrl !== data.logoUrl) {
    await destroyImageAtUrl(previous.logoUrl);
  }
  if (previous?.heroImageUrl && previous.heroImageUrl !== data.heroImageUrl) {
    await destroyImageAtUrl(previous.heroImageUrl);
  }
  return { ok: true };
}
