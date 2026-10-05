"use server";

import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { authorizeAction } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  inquiryDetailsSchema,
  inquiryStatusSchema,
  toInquiryDetailsData,
} from "@/lib/validations/inquiry-admin";

// Seguimiento de consultas (PRD RF-A14). OWNER y EDITOR pueden atenderlas.
// Las lecturas del admin no usan caché: no hay tags que invalidar.

const idSchema = z.string().min(1).max(40);

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

export async function setInquiryStatus(id: unknown, status: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  const parsedStatus = inquiryStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, status: 400, error: "Solicitud inválida." };
  }

  try {
    await prisma.inquiry.update({
      where: { id: parsedId.data },
      data: { status: parsedStatus.data },
      select: { id: true },
    });
    return { ok: true };
  } catch (error) {
    if (isNotFound(error)) return { ok: false, status: 404, error: "La consulta ya no existe." };
    throw error;
  }
}

export async function saveInquiryDetails(id: unknown, input: unknown): Promise<ActionResult> {
  const authorization = await authorizeAction();
  if (!authorization.ok) return authorization;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, status: 400, error: "Solicitud inválida." };
  const parsed = inquiryDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.inquiry.update({
      where: { id: parsedId.data },
      data: toInquiryDetailsData(parsed.data),
      select: { id: true },
    });
    return { ok: true };
  } catch (error) {
    if (isNotFound(error)) return { ok: false, status: 404, error: "La consulta ya no existe." };
    throw error;
  }
}
