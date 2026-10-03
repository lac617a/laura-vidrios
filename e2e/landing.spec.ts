import { expect, test } from "@playwright/test";

import { findInquiry } from "./db";
import { openWhatsapp, readWhatsappLink, setupInquiryTests } from "./helpers";

// Página de inicio (S8). Criterio del ROADMAP: a WhatsApp en 2 toques o menos desde la landing.

setupInquiryTests();

test("hero: catálogo y WhatsApp a un toque", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Espejos que");

  const whatsapp = page.getByRole("link", { name: "Escríbenos por WhatsApp" }).first();
  const { message, code } = await readWhatsappLink(whatsapp);
  expect(message.startsWith("Hola, vengo de la página web")).toBe(true);
  await openWhatsapp(page, whatsapp);
  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "GENERAL",
      source: "landing-hero /",
    });

  await page.getByRole("link", { name: "Ver catálogo" }).click();
  await expect(page).toHaveURL(/\/espejos$/);
});

test("destacado: consulta directa por WhatsApp con la medida principal", async ({ page }) => {
  await page.goto("/");
  const consult = page.getByRole("link", { name: /^Consultar .+ por WhatsApp$/ }).first();
  await consult.scrollIntoViewIfNeeded();
  const name = (await consult.getAttribute("aria-label"))!.replace(
    /^Consultar | por WhatsApp$/g,
    "",
  );

  const { message, code } = await readWhatsappLink(consult);
  expect(message).toContain(`${name}\nRef: ESP-`);
  expect(message).toMatch(/\nMedida: (Ø )?\d+( × \d+)? cm\n/);
  expect(message).toMatch(/\/espejos\/[a-z0-9-]+\?medida=\d+x\d+\n/);

  await openWhatsapp(page, consult);
  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "CATALOG",
      source: "landing-destacados",
      items: [{ productName: name }],
    });
});

test("secciones, footer, política de datos y datos estructurados", async ({ page }) => {
  await page.goto("/");
  for (const title of [
    "Un espejo para cada espacio",
    "Tu espejo en 3 pasos",
    "Del taller a tu pared",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeAttached();
  }
  await expect(page.getByRole("link", { name: /A la medida Diseña el tuyo/ })).toHaveAttribute(
    "href",
    "/a-la-medida",
  );

  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd!)).toMatchObject({
    "@type": "LocalBusiness",
    name: "Espejos Demo",
    address: { addressCountry: "CO" },
  });

  await page.getByRole("contentinfo").getByRole("link", { name: "Política de datos" }).click();
  await expect(page).toHaveURL(/\/politica-de-datos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Política de tratamiento de datos personales",
  );
  await expect(page.getByRole("heading", { level: 2, name: "Tus derechos" })).toBeVisible();
});

test("menú del celular: abre, navega y se cierra", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menú lateral solo existe en pantallas pequeñas.");
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Espejos Demo" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await menu.getByRole("link", { name: "A la medida" }).click();
  await expect(page).toHaveURL(/\/a-la-medida$/);
  await expect(menu).toBeHidden();
});

test("con movimiento reducido las secciones se ven sin animación", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Sin desplazarse: las secciones de abajo ya están visibles (sin el fade de entrada).
  const section = page.locator("[data-reveal]").last();
  await expect(section).toHaveCSS("opacity", "1");
  await expect(section).toHaveCSS("transform", "none");
});
