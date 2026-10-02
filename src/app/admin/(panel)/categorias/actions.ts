"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import type { ActionFailure, ActionResult } from "@/lib/action-result";
import { CATEGORIES_TAG, PRODUCTS_TAG } from "@/lib/cache-tags";
import * as catalog from "@/lib/catalog-admin";
import { authorizeAction } from "@/lib/dal";
import { categoryFormSchema } from "@/lib/validations/category";

const idSchema = z.string().min(1).max(40);

// Las categorías aparecen en las fichas de producto: se invalidan ambos tags.
function invalidateCatalog() {
  updateTag(CATEGORIES_TAG);
  updateTag(PRODUCTS_TAG);
}

function invalid(error: z.ZodError): ActionFailure {
  return {
    ok: false,
    status: 400,
    error: "Revisa los campos marcados.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export async function saveCategory(id: unknown, input: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (id === null) {
      await catalog.createCategory(parsed.data);
    } else {
      const parsedId = idSchema.safeParse(id);
      if (!parsedId.success) return { ok: false, status: 404, error: "La categoría no existe." };
      await catalog.updateCategory(parsedId.data, parsed.data);
    }
    invalidateCatalog();
    return { ok: true };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

export async function deleteCategory(id: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, status: 404, error: "La categoría no existe." };

  try {
    await catalog.deleteCategory(parsedId.data);
    invalidateCatalog();
    return { ok: true };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

export async function moveCategory(id: unknown, direction: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  const parsedDirection = z.enum(["up", "down"]).safeParse(direction);
  if (!parsedId.success || !parsedDirection.success) {
    return { ok: false, status: 400, error: "Solicitud inválida." };
  }

  try {
    await catalog.moveCategory(parsedId.data, parsedDirection.data);
    invalidateCatalog();
    return { ok: true };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}
