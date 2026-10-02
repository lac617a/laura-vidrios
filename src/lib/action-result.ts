// Resultado estándar de las Server Actions del admin (seguro para importar en el cliente).

export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      status: 400 | 401 | 403 | 500;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
