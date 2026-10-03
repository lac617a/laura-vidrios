<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proyecto

Catálogo de espejos (Colombia, COP). Alcance en `PRD.md`, plan en `ROADMAP.md`: actualiza el estado del sprint en ROADMAP al terminar tareas.

- Interfaz y contenido en español (`es-CO`); código, nombres de modelos y variables en inglés.
- Prisma **7.10** fijado (no subir a 8 sin decidirlo). Cliente generado en `src/generated/prisma` (`import { … } from "@/generated/prisma/client"`); se regenera en `postinstall`.
- Usa `@/lib/prisma` en código de la app (es `server-only`). Los scripts y el seed crean su propio cliente.
- `cacheComponents: true`: lecturas de BD por request van con `await connection()` dentro de `<Suspense>`, o se cachean con `"use cache"` + `cacheTag`.
- Base de datos: **nunca** ejecutes `migrate dev`, `migrate reset`, `db push` ni el seed contra Neon. Solo `pnpm db:deploy` en Vercel.
- Precios en COP como enteros (IVA incluido). Medidas en centímetros enteros.
- `pnpm build` necesita la BD accesible: `getSettings()` (`"use cache"`) se prerenderiza en el build.
- Auth: lee la sesión solo con `src/lib/dal.ts` (`requireAdmin()` en páginas, `authorizeAction()` en cada Server Action). Configuración del negocio: solo rol `OWNER`. Tras mutar datos cacheados, llama a `updateTag(<tag>)`.
- Componentes de `src/components/ui` (shadcn, base-nova/Base UI): usan `render={<Link …/>}` en vez de `asChild`. Nada de `Math.random()` ni `Date.now()` en fallbacks de Suspense (rompe el prerender).
- Catálogo del admin: escrituras en `src/lib/catalog-admin.ts` (lanzan `CatalogError` con mensajes para la dueña), lecturas en `src/lib/catalog-admin-queries.ts`, esquemas en `src/lib/validations/`. En la UI, las acciones se ejecutan con `useAdminAction()`.
- Imágenes: Cloudinary vía `src/lib/cloudinary.ts` (URLs, cliente) y `src/lib/cloudinary-server.ts` (firma y borrado). Muéstralas con `<CloudinaryImage>` (nunca el optimizador de Next). Las subidas pasan por `signImageUpload` → navegador → verificación de firma (`src/app/admin/(panel)/image-actions.ts`). Carpetas separadas por entorno.
- Tests con Vitest junto al código (`*.test.ts`); `server-only` está simulado en `src/test/`.
- Antes de terminar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
