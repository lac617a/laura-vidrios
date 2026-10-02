import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

const DAY = 60 * 60 * 24;

/**
 * URL base de auth. En Vercel cada deploy (producción y previews) tiene su propio host,
 * así que se permiten los hosts que Vercel inyecta en ese deploy. En local se usa BETTER_AUTH_URL.
 */
function authBaseURL() {
  const fallback = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const vercelHosts = [
    process.env.CANONICAL_HOST,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ].filter((host): host is string => Boolean(host));

  if (vercelHosts.length === 0) return fallback;
  return { allowedHosts: vercelHosts, fallback };
}

export const auth = betterAuth({
  appName: "Admin catálogo de espejos",
  baseURL: authBaseURL(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Sin registro público: los usuarios se crean con `pnpm admin:create` (PRD RF-A01).
    disableSignUp: true,
    minPasswordLength: 10,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "EDITOR", input: false },
    },
  },
  session: {
    expiresIn: 30 * DAY,
    updateAge: DAY,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    // En BD para que el límite se comparta entre instancias serverless.
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  telemetry: { enabled: false },
  // nextCookies debe ir al final: permite setear cookies desde Server Actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
