"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import type { ActionFailure, ActionResult } from "@/lib/action-result";
import { PRODUCTS_TAG } from "@/lib/cache-tags";
import * as catalog from "@/lib/catalog-admin";
import { authorizeAction } from "@/lib/dal";
import { productFormSchema } from "@/lib/validations/product";

const idSchema = z.string().min(1).max(40);

function invalid(error: z.ZodError): ActionFailure {
  return {
    ok: false,
    status: 400,
    error: "Revisa los campos marcados.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string; reference: string }>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const product = await catalog.createProduct(parsed.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true, data: product };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

export async function updateProduct(
  id: unknown,
  input: unknown,
): Promise<ActionResult<{ reference: string; slug: string }>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  const parsed = productFormSchema.safeParse(input);
  if (!parsedId.success) return { ok: false, status: 404, error: "El producto no existe." };
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { reference, slug } = await catalog.updateProduct(parsedId.data, parsed.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true, data: { reference, slug } };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setProductStatus(id: unknown, status: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, status: 400, error: "Solicitud inválida." };
  }

  try {
    await catalog.setProductStatus(parsedId.data, parsedStatus.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

export async function setProductFeatured(id: unknown, featured: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  const parsedFeatured = z.boolean().safeParse(featured);
  if (!parsedId.success || !parsedFeatured.success) {
    return { ok: false, status: 400, error: "Solicitud inválida." };
  }

  try {
    await catalog.setProductFeatured(parsedId.data, parsedFeatured.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}

export async function duplicateProduct(
  id: unknown,
): Promise<ActionResult<{ id: string; reference: string }>> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, status: 404, error: "El producto no existe." };

  try {
    const copy = await catalog.duplicateProduct(parsedId.data);
    updateTag(PRODUCTS_TAG);
    return { ok: true, data: copy };
  } catch (error) {
    return catalog.catalogFailure(error);
  }
}
