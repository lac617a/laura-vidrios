import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

// Verificación de despliegue: confirma que la app llega a la base de datos.
export async function GET() {
  await connection();

  const headers = { "Cache-Control": "no-store" };
  const environment = process.env.VERCEL_ENV ?? "local";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", environment }, { headers });
  } catch {
    return Response.json(
      { status: "error", database: "unreachable", environment },
      { status: 503, headers },
    );
  }
}
