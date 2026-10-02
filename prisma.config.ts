import "dotenv/config";
import { defineConfig } from "prisma/config";

// El CLI (migraciones) usa la conexión directa. En Neon es DATABASE_URL_UNPOOLED;
// en local no existe y se usa DATABASE_URL.
// Se lee con process.env (no con env()) para que `prisma generate` funcione sin BD, por ejemplo en CI.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
