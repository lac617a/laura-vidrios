import { z } from "zod";

import { InquiryStatus } from "@/generated/prisma/enums";
import { nullIfEmpty, optionalText } from "@/lib/validations/common";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

// Datos que la dueña completa al atender una consulta (PRD RF-A14). Formulario y Server Action.

export const inquiryStatusSchema = z.enum(InquiryStatus);

export const inquiryDetailsSchema = z.object({
  customerName: optionalText(80),
  customerPhone: z
    .string()
    .trim()
    .refine((value) => value === "" || normalizeWhatsappNumber(value) !== null, {
      message: "Celular colombiano de 10 dígitos que empiece por 3.",
    }),
  notes: optionalText(2000),
});

export type InquiryDetailsValues = z.infer<typeof inquiryDetailsSchema>;

/** Valores del formulario → columnas de Inquiry (teléfono en formato de wa.me). */
export function toInquiryDetailsData(values: InquiryDetailsValues) {
  return {
    customerName: nullIfEmpty(values.customerName),
    customerPhone: values.customerPhone ? normalizeWhatsappNumber(values.customerPhone) : null,
    notes: nullIfEmpty(values.notes),
  };
}
