import type { ReactNode } from "react";

import { FieldGroup } from "@/components/ui/field";

/** Sección de formulario del admin: título y ayuda a la izquierda (desktop), campos a la derecha. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b pb-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <FieldGroup>{children}</FieldGroup>
    </section>
  );
}

/** Barra fija inferior con las acciones de guardar. */
export function FormSaveBar({ children, notice }: { children: ReactNode; notice?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      {notice && <span className="mr-auto text-sm text-muted-foreground">{notice}</span>}
      {children}
    </div>
  );
}
