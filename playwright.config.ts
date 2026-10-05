import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// E2E contra la BD local con el seed (en CI: Postgres del workflow). Las pruebas leen la BD para
// comprobar el registro de consultas; e2e/db.ts se niega a conectarse a algo que no sea local.
config({ quiet: true });

// E2E_PORT: para correr contra otro servidor ya levantado (p. ej. `pnpm start -p 3100`).
const PORT = Number(process.env.E2E_PORT ?? 3000);
const isCI = Boolean(process.env.CI);
// Safari (WebKit), tras `pnpm exec playwright install webkit`: E2E_WEBKIT=iphone (lo que corre CI)
// o E2E_WEBKIT=all (también Safari de escritorio, para la matriz de QA).
const webkit = process.env.E2E_WEBKIT;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Una sola BD y un solo rate limit compartido: en serie.
  workers: 1,
  reporter: isCI ? [["github"], ["list"]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-CO",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    ...(webkit ? [{ name: "iphone", use: { ...devices["iPhone 15"] } }] : []),
    ...(webkit === "all" ? [{ name: "safari", use: { ...devices["Desktop Safari"] } }] : []),
  ],
  // En local reutiliza `pnpm dev` si ya está corriendo; en CI arranca el build de producción.
  webServer: {
    command: isCI ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
