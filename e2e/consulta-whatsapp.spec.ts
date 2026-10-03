import { expect, test, type Page } from "@playwright/test";

import { findInquiry } from "./db";
import { chooseOption, openWhatsapp, readWhatsappLink, setupInquiryTests } from "./helpers";

// Flujo de venta (Hito B): elegir medida → enlace de wa.me con el mensaje y el código →
// la consulta queda registrada en la BD. Datos del seed: WhatsApp 573000000000,
// ESP-0001 Espejo Redondo Luna LED (Ø 60 / Ø 80), ESP-0002 Rectangular Baño Classic (60 × 80 a $ 260.000).

setupInquiryTests();

const chooseSize = (page: Page, name: RegExp) => chooseOption(page, name);

test("consulta de una medida del catálogo con envío y ciudad", async ({ page }) => {
  await page.goto("/espejos/espejo-rectangular-bano-classic");
  await chooseSize(page, /60 × 80 cm/);
  await expect(page).toHaveURL(/[?&]medida=60x80/);

  await page.getByRole("checkbox", { name: "Necesito envío" }).check();
  await page.getByRole("combobox", { name: "Ciudad" }).fill("Medellín");

  const cta = page.getByRole("link", { name: "Consultar por WhatsApp" });
  await expect(cta).toHaveAttribute("href", /Medell%C3%ADn/);
  const { message, code } = await readWhatsappLink(cta);
  expect(message).toContain("Espejo Rectangular Baño Classic\nRef: ESP-0002-60x80\n");
  // formatCOP usa Intl: entre "$" y la cifra va un espacio de no separación (\s lo acepta).
  expect(message).toMatch(/Medida: 60 × 80 cm\nPrecio: \$\s260\.000\n/);
  expect(message).toContain("/espejos/espejo-rectangular-bano-classic?medida=60x80\n");
  expect(message).toContain("Necesito: envío\nCiudad: Medellín\n");

  await openWhatsapp(page, cta);

  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "CATALOG",
      source: "detalle",
      city: "Medellín",
      needsShipping: true,
      needsInstallation: false,
      items: [
        {
          reference: "ESP-0002-60x80",
          productName: "Espejo Rectangular Baño Classic",
          widthCm: 60,
          heightCm: 80,
          isCustomSize: false,
          priceSnapshot: 260000,
        },
      ],
    });

  // Cada consulta lleva un código nuevo.
  await expect(cta).not.toHaveAttribute("href", new RegExp(`%23${code}`));
});

test("medida personalizada en un espejo redondo", async ({ page }) => {
  await page.goto("/espejos/espejo-redondo-luna-led");
  await chooseSize(page, /Otra medida/);
  await expect(page).toHaveURL(/[?&]medida=otra/);

  const diameter = page.getByRole("spinbutton", { name: "Diámetro (cm)" });
  await diameter.fill("300");
  await expect(page.getByText("Escribe la medida que necesitas para consultar.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveCount(0);

  await diameter.fill("90");
  const cta = page.getByRole("link", { name: "Consultar por WhatsApp" });
  const { message, code } = await readWhatsappLink(cta);
  expect(message).toContain("Ref: ESP-0001\nMedida: Ø 90 cm (medida personalizada)\n");
  expect(message).not.toContain("Precio:");

  await openWhatsapp(page, cta);

  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "CATALOG",
      items: [{ reference: "ESP-0001", widthCm: 90, heightCm: 90, isCustomSize: true }],
    });
});

test("botón flotante: consulta general desde el catálogo", async ({ page }) => {
  await page.goto("/espejos?utm_source=instagram");
  const float = page.getByRole("link", { name: "Escríbenos por WhatsApp" });
  const { message, code } = await readWhatsappLink(float);
  expect(message.startsWith("Hola, vengo de la página web")).toBe(true);

  await openWhatsapp(page, float);

  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "GENERAL",
      source: "flotante /espejos utm_source=instagram",
      items: [],
    });

  // En la ficha de producto manda su propio botón: el flotante no aparece.
  await page.goto("/espejos/espejo-redondo-luna-led");
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Escríbenos por WhatsApp" })).toBeHidden();
});

test("barra fija en el celular", async ({ page, isMobile }) => {
  test.skip(!isMobile, "La barra solo existe en pantallas pequeñas.");

  await page.goto("/espejos/espejo-redondo-luna-led");
  const bar = page.getByTestId("sticky-cta");
  const barLink = bar.getByRole("link", { name: "Consultar" });
  // Al cargar, el botón principal está debajo de la galería: la barra se muestra.
  await expect(barLink).toBeVisible();
  await expect(bar).toContainText("$ 520.000");
  await expect(bar).toContainText("Ø 60 cm");

  const { code } = await readWhatsappLink(barLink);
  await openWhatsapp(page, barLink);
  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({ source: "barra-movil", items: [{ reference: "ESP-0001-60x60" }] });

  // Con el botón principal en pantalla, la barra se esconde.
  await page.getByRole("link", { name: "Consultar por WhatsApp" }).scrollIntoViewIfNeeded();
  await expect(barLink).toBeHidden();
});

test("la API rechaza datos inválidos y envíos desde otros sitios", async ({
  request,
  isMobile,
}) => {
  test.skip(isMobile, "Prueba de API: basta con un proyecto.");

  const valid = { type: "GENERAL", code: "E2EAPX", source: "e2e" };
  const crossSite = await request.post("/api/inquiries", {
    data: valid,
    headers: { "sec-fetch-site": "cross-site" },
  });
  expect(crossSite.status()).toBe(403);

  const ambiguous = await request.post("/api/inquiries", { data: { ...valid, code: "E2E0I1" } });
  expect(ambiguous.status()).toBe(400);

  const unknownProduct = await request.post("/api/inquiries", {
    data: {
      type: "CATALOG",
      code: "E2EAP2",
      productId: "no-existe",
      sku: "ESP-0001-60x60",
      customSize: null,
      needsShipping: false,
      needsInstallation: false,
      city: "",
    },
  });
  expect(unknownProduct.status()).toBe(404);
  expect(await findInquiry("E2EAP2")).toBeNull();
});
