"use client";

import { ErrorView } from "@/components/error-view";

import "./globals.css";

// Último recurso: un error en el layout raíz. Reemplaza todo el documento.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>Algo falló</title>
        <ErrorView digest={error.digest} retry={retry} homeHref="/" homeLabel="Ir al inicio" />
      </body>
    </html>
  );
}
