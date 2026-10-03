import { expect, test, type Locator, type Page } from "@playwright/test";

import { deleteInquiries, resetRateLimits } from "./db";

// Utilidades compartidas de las pruebas E2E del sitio público. Datos del seed: WhatsApp 573000000000.

export const WHATSAPP = "https://wa.me/573000000000";

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

/** Las opciones tipo tarjeta son radios ocultos dentro de una etiqueta: se toca la etiqueta. */
export async function chooseOption(page: Page, name: string | RegExp) {
  await page.getByRole("radio", { name }).locator("xpath=..").click();
}
