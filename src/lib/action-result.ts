// Resultado estándar de las Server Actions del admin (seguro para importar en el cliente).

export type ActionFailure = {
  ok: false;
  status: 400 | 401 | 403 | 404 | 409 | 500 | 503;
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/** `ActionResult` sin datos · `ActionResult<{ id: string }>` con datos. */
export type ActionResult<T = never> =
  ([T] extends [never] ? { ok: true } : { ok: true; data: T }) | ActionFailure;
