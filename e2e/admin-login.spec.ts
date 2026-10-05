import { expect, test } from "@playwright/test";

import { resetLoginRateLimits } from "./db";
import { ADMIN } from "./helpers";

// Acceso al panel (S1, suite de lanzamiento S10): sin sesión se pide el login y, al entrar, se
// vuelve a la página pedida. Usuario del seed (solo local/CI).

test.beforeEach(async () => {
  await resetLoginRateLimits();
});

test("pide iniciar sesión, rechaza una contraseña equivocada y vuelve a la página pedida", async ({
  page,
  isMobile,
}) => {
  await page.goto("/admin/consultas");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fconsultas$/);

  await page.getByRole("textbox", { name: "Correo" }).fill(ADMIN.email);
  await page.getByLabel("Contraseña").fill("no-es-la-clave");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();

  await page.getByLabel("Contraseña").fill(ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin\/consultas$/);
  await expect(page.getByRole("heading", { name: "Consultas", level: 1 })).toBeVisible();

  // Cerrar sesión desde el menú de usuario (en el móvil, dentro del menú lateral).
  if (isMobile) await page.getByRole("button", { name: "Mostrar u ocultar el menú" }).click();
  await page.getByRole("button", { name: /Admin Local/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
});

test("bloquea los intentos repetidos", async ({ page, isMobile }) => {
  test.skip(isMobile, "Basta con un proyecto.");
  // El límite de Better Auth solo está activo en producción (en CI se prueba el build).
  test.skip(!process.env.CI, "Solo contra el build de producción.");

  await page.goto("/admin/login");
  await page.getByRole("textbox", { name: "Correo" }).fill(ADMIN.email);
  await page.getByLabel("Contraseña").fill("no-es-la-clave");
  const submit = page.getByRole("button", { name: "Ingresar" });

  // 5 intentos por minuto: el sexto ya responde 429.
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = page.waitForResponse((r) => r.url().endsWith("/api/auth/sign-in/email"));
    await submit.click();
    statuses.push((await response).status());
    await expect(submit).toBeEnabled();
  }
  expect(statuses.at(-1)).toBe(429);
  await expect(
    page.getByText("Demasiados intentos. Espera un minuto e intenta de nuevo."),
  ).toBeVisible();
});
