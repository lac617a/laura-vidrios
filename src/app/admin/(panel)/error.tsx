"use client";

import { ErrorView } from "@/components/error-view";

// Error inesperado en el panel: el menú lateral sigue disponible.
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorView
      digest={error.digest}
      retry={retry}
      homeHref="/admin"
      homeLabel="Ir al resumen"
      as="div"
      className="py-16"
    />
  );
}
