import { z } from "zod";

import { optionalSlug, optionalText } from "@/lib/validations/common";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre.").max(60, "Máximo 60 caracteres."),
  slug: optionalSlug,
  description: optionalText(300),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
