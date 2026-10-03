import Link from "next/link";

// 404 dentro del sitio público (con header y footer): productos borrados o enlaces mal escritos.
export default function PublicNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">Error 404</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-balance">
        No encontramos esta página
      </h1>
      <p className="mt-3 text-muted-foreground">
        Puede que el enlace esté mal escrito o que el espejo ya no esté en el catálogo.
      </p>
      <Link
        href="/espejos"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
      >
        Ver el catálogo
      </Link>
    </main>
  );
}
