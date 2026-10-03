import type { CSSProperties, ReactNode } from "react";

/**
 * Aparece con fade y slide-up (600 ms) al entrar en pantalla, una sola vez (PRD §6.1). Solo CSS
 * (`[data-reveal]` en globals.css) + un único observador para toda la página (`RevealObserver`):
 * no hidrata un componente por sección. Sin JavaScript o con movimiento reducido, se ve de una vez.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Retraso en ms para escalonar elementos vecinos. */
  delay?: number;
  className?: string;
}) {
  return (
    <div
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
