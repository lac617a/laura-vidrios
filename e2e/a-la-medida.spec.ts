import { expect, test, type Page } from "@playwright/test";

import { findInquiry } from "./db";
import { chooseOption, openWhatsapp, readWhatsappLink, setupInquiryTests } from "./helpers";

// Formulario «A la medida» (PRD §10, criterio 2). Configuración del seed: medidas de 20 a 250 cm,
// marcos «Sin marco», «Biselado», «Aluminio negro»…

setupInquiryTests();

const heading = (name: string) => ({ level: 2, name }) as const;
// En <main>: Next también tiene un role="alert" (el anunciador de rutas).
const alert = (page: Page) => page.getByRole("main").getByRole("alert");
// getByRole ignora las páginas que Next guarda ocultas en el DOM (<Activity>).
const sizeInput = (page: Page, name: string) =>
  page.getByRole("spinbutton", { name: `${name} (cm)` });

test("cotización completa: valida el rango y registra la consulta CUSTOM", async ({ page }) => {
  await page.goto("/a-la-medida");

  await chooseOption(page, "Rectangular");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", heading("¿De qué tamaño?"))).toBeVisible();

  // Sin medidas o fuera de rango no deja avanzar y explica el rango permitido.
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(alert(page)).toHaveText("Escribe el ancho y el alto.");
  await sizeInput(page, "Ancho").fill("300");
  await sizeInput(page, "Alto").fill("180");
  await expect(alert(page)).toHaveText("Las medidas van de 20 a 250 cm, en números enteros.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", heading("¿De qué tamaño?"))).toBeVisible();

  await sizeInput(page, "Ancho").fill("120");
  await sizeInput(page, "Alto").press("Enter");
  await expect(page.getByRole("heading", heading("Marco y acabado"))).toBeVisible();

  await chooseOption(page, "Aluminio negro");
  await page.getByRole("button", { name: "Continuar" }).click();

  await chooseOption(page, /Sí, con luz LED/);
  await page.getByRole("button", { name: "Continuar" }).click();

  await page
    .getByRole("textbox", { name: "Notas (opcional)" })
    .fill("Para pared de baño, esquinas redondeadas");
  await page.getByRole("checkbox", { name: "Necesito instalación" }).check();
  await page.getByRole("combobox", { name: "Ciudad" }).fill("Bogotá");
  await expect(page.getByText("¿Tienes una foto o un plano del espacio?")).toBeVisible();
  await page.getByRole("button", { name: "Ver resumen" }).click();

  await expect(page.getByRole("heading", heading("Revisa tu espejo"))).toBeVisible();
  const cta = page.getByRole("link", { name: "Enviar por WhatsApp" });
  const { message, code } = await readWhatsappLink(cta);
  // El segundo ejemplo de mensaje del PRD, tal cual.
  expect(message).toBe(
    [
      "Hola, quiero cotizar un espejo a la medida:",
      "",
      "Forma: Rectangular",
      "Medida: 120 × 180 cm",
      "Marco: Aluminio negro",
      "Luz LED: Sí",
      "Cantidad: 1",
      "Notas: Para pared de baño, esquinas redondeadas",
      "",
      "Necesito: instalación",
      "Ciudad: Bogotá",
      "",
      `Código de consulta: #${code}`,
    ].join("\n"),
  );

  await openWhatsapp(page, cta);
  await expect(page.getByRole("status")).toContainText(`#${code}`);

  await expect
    .poll(() => findInquiry(code))
    .toMatchObject({
      type: "CUSTOM",
      source: "a-la-medida",
      city: "Bogotá",
      needsShipping: false,
      needsInstallation: true,
      items: [
        {
          reference: "A-LA-MEDIDA",
          productName: "Espejo a la medida · Rectangular",
          widthCm: 120,
          heightCm: 180,
          isCustomSize: true,
          customShape: "RECTANGULAR",
          frameDetails: "Aluminio negro",
          hasLed: true,
          quantity: 1,
          notes: "Para pared de baño, esquinas redondeadas",
        },
      ],
    });
});

test("el borrador se conserva al recargar la página", async ({ page }) => {
  await page.goto("/a-la-medida");
  await chooseOption(page, "Ovalado");
  await page.getByRole("button", { name: "Continuar" }).click();
  await sizeInput(page, "Ancho").fill("60");
  await sizeInput(page, "Alto").fill("90");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", heading("Marco y acabado"))).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", heading("Marco y acabado"))).toBeVisible();
  await page.getByRole("button", { name: "Atrás" }).click();
  await expect(sizeInput(page, "Ancho")).toHaveValue("60");
  await expect(sizeInput(page, "Alto")).toHaveValue("90");

  // "Empezar otra cotización" (en el resumen) también lo borra; aquí basta con volver al inicio.
  await page.getByRole("button", { name: "Atrás" }).click();
  await expect(page.getByRole("radio", { name: "Ovalado" })).toBeChecked();
});

test("desde la ficha de un espejo redondo, llega con la forma elegida", async ({ page }) => {
  await page.goto("/espejos/espejo-redondo-luna-led");
  await chooseOption(page, /Otra medida/);
  await page.getByRole("link", { name: "Diséñalo a la medida" }).click();

  await expect(page).toHaveURL(/\/a-la-medida\?forma=redondo$/);
  await expect(page.getByRole("radio", { name: "Redondo" })).toBeChecked();
  await page.getByRole("button", { name: "Continuar" }).click();
  // Redondo: una sola medida.
  await expect(sizeInput(page, "Diámetro")).toBeVisible();
  await expect(sizeInput(page, "Alto")).toHaveCount(0);
});
