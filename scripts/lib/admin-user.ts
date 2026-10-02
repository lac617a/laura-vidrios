import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import type { PrismaClient, Role } from "../../src/generated/prisma/client";

/**
 * Crea o actualiza un usuario del panel con credenciales de Better Auth
 * (cuenta "credential" con la contraseña hasheada). Si ya existía, cierra sus sesiones.
 * Devuelve true si lo creó.
 */
export async function upsertAdminUser(
  prisma: PrismaClient,
  input: { email: string; name: string; role: Role; password: string },
): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { name: input.name, role: input.role, emailVerified: true },
        })
      : await tx.user.create({
          data: {
            id: randomUUID(),
            email,
            name: input.name,
            role: input.role,
            emailVerified: true,
          },
        });

    const account = await tx.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (account) {
      await tx.account.update({ where: { id: account.id }, data: { password: passwordHash } });
    } else {
      await tx.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }

    // Con contraseña nueva, las sesiones abiertas dejan de valer.
    if (existing) await tx.session.deleteMany({ where: { userId: user.id } });
    return !existing;
  });
}
