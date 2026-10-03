# Catálogo de espejos

Sitio web para un negocio de espejos en Colombia: landing, catálogo y panel de gestión. Los clientes consultan por WhatsApp; no hay compra en línea.

- **Producto:** [PRD.md](PRD.md)
- **Plan por sprints:** [ROADMAP.md](ROADMAP.md)

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma 7 · PostgreSQL (local) / Neon (producción) · Vercel.

## Requisitos

- Node.js 22+
- pnpm 11 (`corepack enable`)
- PostgreSQL 18 local (por ejemplo `scoop install postgresql`, que define `PGDATA`)

## Primeros pasos

```bash
pnpm install
```

```bash
cp .env.example .env
```

Genera un secreto y pégalo en `BETTER_AUTH_SECRET` dentro de `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```bash
pnpm db:start
```

La primera vez hay que crear la base de datos local:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE lauravidrio;"
```

```bash
pnpm db:migrate
```

```bash
pnpm db:seed
```

```bash
pnpm dev
```

Abre <http://localhost:3000>. `GET /api/health` confirma la conexión con la base de datos.

El panel está en <http://localhost:3000/admin>. El seed crea dos usuarios **solo en la BD local**: `admin@local.test` (acceso total) y `editor@local.test` (edición). La contraseña está en `.env.example`.

## Scripts

| Script                                 | Qué hace                                                    |
| -------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                             | Servidor de desarrollo                                      |
| `pnpm build`                           | Build de producción                                         |
| `pnpm lint` · `typecheck` · `format`   | Calidad de código                                           |
| `pnpm test`                            | Tests unitarios (Vitest)                                    |
| `pnpm e2e`                             | E2E con Playwright contra la BD local con el seed. Reutiliza `pnpm dev` si está corriendo. La primera vez: `pnpm exec playwright install chromium` |
| `pnpm db:start` · `db:stop` · `db:status` | PostgreSQL local (usa `pg_ctl` y `PGDATA`)               |
| `pnpm db:migrate`                      | Crea y aplica migraciones **(solo local)**                  |
| `pnpm db:deploy`                       | Aplica migraciones existentes (lo que corre en Vercel)      |
| `pnpm db:seed`                         | Reemplaza el catálogo local con datos de prueba             |
| `pnpm db:studio`                       | Prisma Studio para ver la BD                                |
| `pnpm admin:create`                    | Crea o actualiza un usuario del panel (pide la contraseña)  |

## Imágenes (Cloudinary)

Pon `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `.env` (en Vercel, en sus variables). Sin ellas, el panel funciona pero no permite subir fotos.

Los archivos se separan por entorno: `catalogo-espejos/dev/` (local), `catalogo-espejos/preview/` (previews) y `catalogo-espejos/prod/` (producción).

## Entornos y datos

| Entorno    | Base de datos                         | Migraciones                       |
| ---------- | ------------------------------------- | --------------------------------- |
| Local      | PostgreSQL en `localhost`             | `pnpm db:migrate`                 |
| Preview    | Rama de Neon por cada PR              | `pnpm db:deploy` (en el build)    |
| Producción | Neon, rama `main`                     | `pnpm db:deploy` (en el build)    |

Reglas (PRD §9.2):

1. El `.env` local nunca contiene URLs de Neon. Las variables de producción viven solo en Vercel.
2. `prisma migrate dev`, `migrate reset` y `db push` **nunca** se ejecutan contra Neon.
3. El seed se niega a correr si la base de datos no está en `localhost`.
4. Todo cambio de esquema va en una migración versionada en git.

## Despliegue (Vercel + Neon)

1. Importar el repositorio en Vercel (framework Next.js). `vercel.json` ya define el build command `pnpm db:deploy && pnpm build`.
2. En el proyecto de Vercel: **Storage → Neon → Create**. Elegir la región `us-east-1` y Postgres 18, y activar las ramas para previews. La integración crea `DATABASE_URL` (con pooler) y `DATABASE_URL_UNPOOLED` (directa).
3. Agregar las variables de entorno:
   - `NEXT_PUBLIC_SITE_URL` y `BETTER_AUTH_URL` con la URL `https://<proyecto>.vercel.app`.
   - `BETTER_AUTH_SECRET`: un secreto para Production y **otro distinto** para Preview.
4. Desplegar y verificar `https://<proyecto>.vercel.app/api/health`.
   - En **Analytics**, activar Web Analytics (visitas sin cookies). El evento `whatsapp_click` es un evento personalizado: Vercel solo los registra en el plan Pro.
5. Crear la cuenta de la dueña en producción. Descarga temporalmente las variables de producción:

   ```bash
   vercel env pull .env.production.local --environment=production
   ```

   ```bash
   pnpm admin:create --env-file .env.production.local
   ```

   Pide escribir `CONFIRMAR` porque la base no es local. Después borra `.env.production.local`.
