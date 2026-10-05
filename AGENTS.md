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
- Catálogo público: lecturas cacheadas en `src/lib/catalog-public.ts` (`"use cache"` + tags). Filtros en la URL con nuqs (`src/lib/catalog-filters.ts`, mismos parsers en servidor y cliente; claves en español). Animaciones con Motion vía `LazyMotion` (`m.*`, nunca `motion.*`) y `MotionConfig reducedMotion="user"`.
- Ficha `/espejos/[slug]`: `params` se lee dentro de `<Suspense>`; `generateStaticParams` siempre devuelve al menos un valor (requisito de Cache Components). og:image de producto = JPG de Cloudinary (`IMAGE_PRESETS.og`); si un `generateMetadata` define `openGraph`, hereda imágenes del padre con `ResolvingMetadata`. URL absoluta del sitio con `getSiteUrl()`.
- Consultas por WhatsApp: los botones son `<a href="https://wa.me/…">` reales. El código de consulta sale de `useInquiryCode()` y el registro se hace con `registerInquiry()` en el `onClick` (`src/lib/inquiry-client.ts`: `sendBeacon` sin `await` ni `preventDefault`). `POST /api/inquiries` valida con `src/lib/validations/inquiry.ts` y arma el snapshot desde la BD (`src/lib/inquiries.ts`). Para consultas generales usa `<GeneralWhatsappLink channel="…">`. Rate limit propio con `consumeRateLimit()` (`src/lib/rate-limit.ts`, tabla `RequestThrottle`). Analítica solo con `trackEvent()` (`src/lib/analytics.ts`).
- Next guarda hasta 3 páginas visitadas ocultas en el DOM (`<Activity>`, ver `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`). En componentes que se repiten entre páginas, los `id`/`name`/`htmlFor` van con `useId()`. Los estilos globales de una página van con `<PageStyles css=…>` (`src/components/site/page-styles.tsx`: `<style>` que se desactiva con `media="not all"` al ocultarse), nunca con `body:has(…)`. Los efectos se limpian al ocultarse la página. En una navegación del cliente, `window.location` aún no cambió al renderizar: lee la URL con `useSearchParams()` (en Suspense).
- Landing (`src/components/landing/`): todo lo que lee está cacheado (`getLandingData()`, `getSettings()`), así la página sale prerenderizada. Presupuesto: Lighthouse móvil ≥ 90. Sin Motion: aparición con `<Reveal>` (`data-reveal` + CSS) y un único `<RevealObserver>`, parallax y entrada del hero con CSS, contadores con `IntersectionObserver`. Lenis se importa dinámicamente. Antes de sumar JavaScript a las páginas públicas, mide (Base UI en el header pesaba ~35 KB: el menú del celular es un `<dialog>` nativo).
- Consultas en el admin: lecturas en `src/lib/inquiry-admin.ts` (filtros validados con Zod desde la URL, dashboard), acciones en `src/app/admin/(panel)/consultas/actions.ts` (OWNER y EDITOR). Fechas y "hoy" siempre en hora de Colombia con `src/lib/dates.ts` (el servidor corre en UTC). Gráficas solo en el admin (Recharts vía `src/components/ui/chart.tsx`).
- next/image: `priority` está deprecado en Next 16. Usa `preload` solo en la imagen LCP (hero, primera foto de la ficha) y `loading="eager"` para otras visibles al cargar.
- «A la medida»: lógica pura en `src/lib/custom-order.ts` (pasos, validación, borrador), UI en `src/components/custom-order/`. Lo que depende del navegador (localStorage) se dibuja tras `useHydrated()`, sin `setState` en efectos.
- Tests con Vitest junto al código (`*.test.ts`); `server-only` está simulado en `src/test/`. E2E con Playwright en `e2e/` (`pnpm e2e`, BD local con el seed; `e2e/db.ts` se niega a conectarse fuera de localhost; `E2E_PORT=3100` para usar un servidor ya levantado en otro puerto). Usa selectores que respeten la visibilidad (`getByRole`, `getByLabel`) por las páginas ocultas.
- Lanzamiento (S10): `sitemap.ts`/`robots.ts` en `src/app`; redirección al dominio en `next.config.ts` (`src/lib/canonical-host.ts`), no en `proxy.ts`; errores del servidor en `src/instrumentation.ts`; checklist en `docs/lanzamiento.md`. Formularios con datos sensibles: no envíes nada antes de hidratar (`useHydrated()` en el botón) y no uses `defaultValues` vacíos que borren lo autocompletado.
- Accesibilidad: `e2e/accesibilidad.spec.ts` corre axe (WCAG 2.2 AA) en todas las páginas; una página nueva va a esa lista. Nada de `opacity-*` sobre texto gris. En E2E, antes de interactuar justo tras cargar, usa `waitForHydration()` (WebKit hidrata más lento). Safari: `E2E_WEBKIT=iphone|all` tras `pnpm exec playwright install webkit`. Con un servidor en otro puerto, arráncalo con `BETTER_AUTH_URL` de ese puerto.
- Antes de terminar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (y `pnpm e2e` si tocaste el sitio público).
