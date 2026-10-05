import type { Instrumentation } from "next";

// Errores del servidor en una sola línea JSON, fácil de filtrar en los logs de Vercel
// (`"level":"error"`) y de cruzar con el código que ve la persona en la pantalla de error
// (`digest`). Sin cabeceras ni query: pueden traer cookies, teléfonos o búsquedas.
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      message: error instanceof Error ? error.message : String(error),
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      routeType: context.routeType,
      environment: process.env.VERCEL_ENV ?? "local",
    }),
  );
};
