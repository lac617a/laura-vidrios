import { expect, test, type Page } from "@playwright/test";

import { deleteInquiries, findInquiry, resetRateLimits } from "./db";
import { signInAsAdmin, waitForHydration } from "./helpers";

// Seguimiento de consultas (S9). Criterio del ROADMAP: la dueña copia el código de un mensaje de
// WhatsApp, lo encuentra y lo pasa a "Cotizada" desde el móvil. Usuario del seed (solo local/CI).

const codes: string[] = [];

test.afterAll(async () => {
  await deleteInquiries(codes);
});

/** Una consulta general nueva, como la que deja el botón flotante. */
async function createInquiry(page: Page, code: string) {
  await resetRateLimits();
  const response = await page.request.post("/api/inquiries", {
    data: { type: "GENERAL", code, source: "e2e" },
  });
  expect(response.status()).toBe(201);
  codes.push(code);
}

test("buscar el código del mensaje, pasarla a Cotizada y guardar el cliente", async ({
  page,
  isMobile,
}) => {
  const code = isMobile ? "E2EMQB" : "E2EDQB";
  await createInquiry(page, code);
  await signInAsAdmin(page);

  await page.goto("/admin/consultas");
  // Como llega copiado del chat: con "#" y en minúsculas.
  const search = page.getByRole("searchbox", { name: "Buscar por código, nombre o teléfono" });
  await waitForHydration(search);
  await search.fill(`#${code.toLowerCase()}`);
  await search.press("Enter");

  // Un solo resultado: el detalle se abre directo.
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: `#${code}` })).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Nueva", pressed: true })).toBeVisible();

  await drawer.getByRole("button", { name: "Cotizada" }).click();
  await expect(page.getByText("Consulta cotizada.")).toBeVisible();
  await expect.poll(async () => (await findInquiry(code))?.status).toBe("QUOTED");

  await drawer.getByRole("textbox", { name: "Nombre" }).fill("Cliente E2E");
  await drawer.getByRole("textbox", { name: "Celular (WhatsApp)" }).fill("601 234 5678");
  await drawer.getByRole("button", { name: "Guardar" }).click();
  await expect(drawer.getByText("Celular colombiano de 10 dígitos")).toBeVisible();

  await drawer.getByRole("textbox", { name: "Celular (WhatsApp)" }).fill("310 555 1234");
  await drawer.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Datos guardados.")).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Abrir chat" })).toHaveAttribute(
    "href",
    "https://wa.me/573105551234",
  );

  // Al cerrar se vuelve al listado completo.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/\/admin\/consultas$/);
});

test("el resumen muestra las consultas y el menú las nuevas", async ({ page, isMobile }) => {
  test.skip(isMobile, "Basta con un proyecto.");
  await createInquiry(page, "E2ENWQ");
  await signInAsAdmin(page);
  await page.goto("/admin");

  await expect(page.getByText("Consultas hoy")).toBeVisible();
  await expect(page.getByText("Consultas por día", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /consultas? nuevas? sin atender/ })).toBeVisible();
  await expect(page.getByLabel(/consultas? nuevas?$/)).toBeVisible();
});
