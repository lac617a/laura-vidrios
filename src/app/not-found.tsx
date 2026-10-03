import Link from "next/link";

// 404 para rutas que no existen (fuera del layout público).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">Error 404</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-balance">
        No encontramos esta página
      </h1>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
