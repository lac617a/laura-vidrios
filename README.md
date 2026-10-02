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

## Scripts

| Script                                 | Qué hace                                                    |
| -------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                             | Servidor de desarrollo                                      |
| `pnpm build`                           | Build de producción                                         |
| `pnpm lint` · `typecheck` · `format`   | Calidad de código                                           |
| `pnpm db:start` · `db:stop` · `db:status` | PostgreSQL local (usa `pg_ctl` y `PGDATA`)               |
| `pnpm db:migrate`                      | Crea y aplica migraciones **(solo local)**                  |
| `pnpm db:deploy`                       | Aplica migraciones existentes (lo que corre en Vercel)      |
| `pnpm db:seed`                         | Reemplaza el catálogo local con datos de prueba             |
| `pnpm db:studio`                       | Prisma Studio para ver la BD                                |

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
3. Agregar `NEXT_PUBLIC_SITE_URL` con la URL `https://<proyecto>.vercel.app`.
4. Desplegar y verificar `https://<proyecto>.vercel.app/api/health`.
