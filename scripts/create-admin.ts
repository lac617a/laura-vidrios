/**
 * Crea o actualiza un usuario del panel (el registro público está desactivado).
 *
 *   pnpm admin:create                                    → BD local (.env)
 *   pnpm admin:create --email ana@correo.com --name Ana  → sin preguntas para correo y nombre
 *   pnpm admin:create --role editor                      → rol EDITOR (por defecto OWNER)
 *   pnpm admin:create --env-file .env.production.local   → otra BD; pide confirmación
 *
 * Si el usuario ya existe, actualiza nombre, rol y contraseña, y cierra sus sesiones.
 */
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient, Role } from "../src/generated/prisma/client";
import { upsertAdminUser } from "./lib/admin-user";

const { values: args } = parseArgs({
  options: {
    "env-file": { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "owner" },
  },
});

const envFile = args["env-file"];
config({ path: envFile ?? ".env", override: Boolean(envFile), quiet: true });

const MIN_PASSWORD = 10;

async function main() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!databaseUrl) fail("DATABASE_URL no está definida.");

  const role = args.role?.toUpperCase();
  if (role !== Role.OWNER && role !== Role.EDITOR) fail('--role debe ser "owner" o "editor".');

  const host = new URL(databaseUrl).hostname;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

  const rl = createInterface({ input: stdin, output: stdout });
  if (!isLocal) {
    console.log(`\n⚠️  Vas a modificar la base de datos en ${host}.`);
    const answer = await rl.question('Escribe "CONFIRMAR" para continuar: ');
    if (answer.trim() !== "CONFIRMAR") fail("Cancelado.");
  }

  const email = (args.email ?? (await rl.question("Correo: "))).trim().toLowerCase();
  const name = (args.name ?? (await rl.question("Nombre: "))).trim();
  rl.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Correo inválido.");
  if (name.length < 2) fail("Escribe un nombre.");

  const password = await readPassword();

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const created = await upsertAdminUser(prisma, { email, name, role, password });
    console.log(
      `\n✅ Usuario ${created ? "creado" : "actualizado"}: ${email} (${role === Role.OWNER ? "acceso total" : "edición"}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

/** Pide la contraseña dos veces sin mostrarla. ADMIN_PASSWORD permite automatizar en local. */
async function readPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  const password = fromEnv ?? (await askHidden("Contraseña: "));
  if (password.length < MIN_PASSWORD)
    fail(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  if (!fromEnv && password !== (await askHidden("Repite la contraseña: "))) {
    fail("Las contraseñas no coinciden.");
  }
  return password;
}

function askHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY)
    fail("Ejecuta el script en una terminal interactiva para escribir la contraseña.");

  return new Promise((resolve) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          if (value) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        value += char;
        stdout.write("•");
      }
    };
    stdin.on("data", onData);
  });
}

function fail(message: string): never {
  console.error(`\n✋ ${message}\n`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
