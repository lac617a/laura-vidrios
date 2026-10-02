#!/usr/bin/env node
// Arranca, detiene o consulta el PostgreSQL local nativo con pg_ctl.
// Uso: pnpm db:start | pnpm db:stop | pnpm db:status
// Requiere la variable PGDATA (scoop la define al instalar postgresql).
import { spawnSync } from "node:child_process";
import path from "node:path";

const action = process.argv[2];
const dataDir = process.env.PGDATA;

if (!["start", "stop", "status"].includes(action)) {
  console.error("Uso: node scripts/db.mjs <start|stop|status>");
  process.exit(1);
}

if (!dataDir) {
  console.error(
    "PGDATA no está definida. Apúntala a la carpeta de datos de tu PostgreSQL local\n" +
      "(ej. C:\\Users\\<tú>\\scoop\\apps\\postgresql\\current\\data).",
  );
  process.exit(1);
}

const args = {
  start: ["start", "-w", "-D", dataDir, "-l", path.join(dataDir, "server.log")],
  stop: ["stop", "-w", "-D", dataDir, "-m", "fast"],
  status: ["status", "-D", dataDir],
}[action];

// stdio "ignore" en start: el servidor queda en segundo plano sin atar la terminal.
const result = spawnSync("pg_ctl", args, {
  stdio: action === "start" ? "ignore" : "inherit",
  shell: process.platform === "win32",
});

if (action === "start") {
  console.log(
    result.status === 0
      ? "✅ PostgreSQL local iniciado."
      : "⚠️  pg_ctl no pudo iniciar el servidor (¿ya estaba corriendo?). Revisa con `pnpm db:status`.",
  );
}

process.exit(result.status ?? 1);
