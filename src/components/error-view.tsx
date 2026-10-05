"use client";

import { RotateCcwIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Pantalla de error inesperado (contenido de los `error.tsx`). Muestra el código (`digest`) que
 * Next deja en los logs de Vercel, para encontrar el error exacto si alguien lo reporta.
 */
export function ErrorView({
  digest,
  retry,
  homeHref,
  homeLabel,
  as: Root = "main",
  className,
}: {
  digest?: string;
  retry: () => void;
  homeHref: string;
  homeLabel: string;
  /** "div" dentro de un layout que ya tiene su propio <main> (el panel). */
  as?: "main" | "div";
  className?: string;
}) {
  return (
    <Root
      className={cn(
        "mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center",
        className,
      )}
    >
      <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">Algo falló</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-balance">
        No pudimos cargar esta página
      </h1>
      <p className="mt-3 text-muted-foreground">
        Fue un problema de nuestro lado. Inténtalo de nuevo en unos segundos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={retry} className="h-11 rounded-full px-6">
          <RotateCcwIcon aria-hidden />
          Reintentar
        </Button>
        <Link
          href={homeHref}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-6")}
        >
          {homeLabel}
        </Link>
      </div>
      {digest && (
        <p className="mt-8 text-xs text-muted-foreground">
          Código del error: <span className="font-mono select-all">{digest}</span>
        </p>
      )}
    </Root>
  );
}
