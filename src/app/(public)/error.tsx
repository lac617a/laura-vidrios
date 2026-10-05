"use client";

import { ErrorView } from "@/components/error-view";

// Error inesperado en el sitio público (BD caída, etc.): se mantienen header, footer y WhatsApp.
export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorView digest={error.digest} retry={retry} homeHref="/" homeLabel="Ir al inicio" />;
}
