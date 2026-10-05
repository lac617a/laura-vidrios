import { expect, test, type Locator, type Page } from "@playwright/test";

import { deleteInquiries, resetLoginRateLimits, resetRateLimits } from "./db";

// Utilidades compartidas de las pruebas E2E del sitio público. Datos del seed: WhatsApp 573000000000.

export const WHATSAPP = "https://wa.me/573000000000";

/** Usuario del seed con acceso total (solo existe en la BD local y en la de CI). */
export const ADMIN = {
  email: "admin@local.test",
  password: process.env.SEED_ADMIN_PASSWORD ?? "espejos-local-2026",
};

/** Inicia sesión por la API (deja la cookie en el contexto de la página). */
export async function signInAsAdmin(page: Page) {
  await resetLoginRateLimits();
  const response = await page.request.post("/api/auth/sign-in/email", { data: ADMIN });
  expect(response.ok()).toBe(true);
}

/** Códigos de las consultas creadas en este worker: se borran al terminar cada archivo. */
const createdCodes: string[] = [];

/** Registra los hooks comunes: rate limit limpio, WhatsApp interceptado y limpieza de consultas. */
export function setupInquiryTests() {
  test.beforeEach(async ({ context }) => {
    await resetRateLimits();
    // No se abre WhatsApp de verdad: la pestaña nueva recibe una página vacía.
    await context.route("https://wa.me/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>WhatsApp</title>" }),
    );
  });

  test.afterAll(async () => {
    await deleteInquiries(createdCodes.splice(0));
  });
}

/** Espera a que el enlace tenga el código (se genera al hidratar) y devuelve el mensaje y el código. */
export async function readWhatsappLink(link: Locator) {
  await expect(link).toHaveAttribute("href", /C%C3%B3digo%20de%20consulta%3A%20%23[A-Z2-9]{6}/);
  const url = new URL((await link.getAttribute("href"))!);
  expect(`${url.origin}${url.pathname}`).toBe(WHATSAPP);
  const message = url.searchParams.get("text") ?? "";
  const code = /Código de consulta: #([A-Z2-9]{6})/.exec(message)![1];
  createdCodes.push(code);
  return { message, code };
}

/** Toca el enlace (abre la pestaña de WhatsApp interceptada) y la cierra. */
export async function openWhatsapp(page: Page, link: Locator) {
  const popup = page.waitForEvent("popup");
  await link.click();
  await (await popup).close();
}

/**
 * Espera a que React hidrate el elemento: antes, un clic o lo escrito no llega al estado (en
 * WebKit la hidratación tarda más). React guarda las props en el nodo al hidratarlo.
 */
export async function waitForHydration(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactProps")),
      ),
    )
    .toBe(true);
  return locator;
}

/** Las opciones tipo tarjeta son radios ocultos dentro de una etiqueta: se toca la etiqueta. */
export async function chooseOption(page: Page, name: string | RegExp) {
  const radio = await waitForHydration(page.getByRole("radio", { name }));
  await radio.locator("xpath=..").click();
}
