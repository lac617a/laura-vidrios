/** Primer elemento enfocable: salta el menú con el teclado (WCAG 2.4.1). Destino: `#contenido`. */
export const SKIP_TARGET_ID = "contenido";

export function SkipLink() {
  return (
    <a
      href={`#${SKIP_TARGET_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
    >
      Saltar al contenido
    </a>
  );
}
