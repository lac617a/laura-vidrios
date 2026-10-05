import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { signInAsAdmin, waitForHydration } from "./helpers";

// Auditoría automática WCAG 2.2 AA (S10) con axe en escritorio y móvil. No reemplaza la revisión
// manual (teclado, lector de pantalla), pero detecta contraste, nombres accesibles, etiquetas…
// Con movimiento reducido: las animaciones de aparición no dejan texto a medio opacar.

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Espera a que terminen las animaciones finitas (fundidos de Motion y de CSS): si axe mide a mitad
 * de un fundido, informa contraste bajo que no existe. Los bucles infinitos (pulso) se ignoran.
 */
async function settle(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" ||
          animation.effect?.getTiming().iterations === Infinity,
      ),
  );
  // Motion anima algunas propiedades con JavaScript (fuera de getAnimations).
  await page.waitForTimeout(400);
}

async function expectNoViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} → ${violation.nodes
        .slice(0, 5)
        .map((node) => node.target.join(" "))
        .join(" | ")}`,
  );
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

const PUBLIC_PAGES = [
  { name: "inicio", path: "/" },
  { name: "catálogo", path: "/espejos" },
  { name: "ficha de producto", path: "/espejos/espejo-redondo-luna-led" },
  { name: "a la medida", path: "/a-la-medida" },
  { name: "política de datos", path: "/politica-de-datos" },
  { name: "página no encontrada", path: "/espejos/no-existe" },
];

for (const { name, path } of PUBLIC_PAGES) {
  test(`sitio público: ${name}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoViolations(page);
  });
}

test("sitio público: filtros del catálogo y menú abiertos", async ({ page, isMobile }) => {
  await page.goto("/espejos");
  if (isMobile) {
    await (await waitForHydration(page.getByRole("button", { name: "Filtros" }))).click();
    await expect(page.getByRole("dialog", { name: "Filtros" })).toBeVisible();
    await expectNoViolations(page);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  } else {
    const search = page.getByRole("searchbox", { name: "Buscar espejos" });
    await (await waitForHydration(search)).fill("luna");
    await expect(page).toHaveURL(/q=luna/);
  }
  await expectNoViolations(page);
});

test("panel: inicio de sesión", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Panel de gestión" })).toBeVisible();
  await expectNoViolations(page);
});

test("panel: páginas de gestión", async ({ page }) => {
  await signInAsAdmin(page);

  for (const path of [
    "/admin",
    "/admin/consultas",
    "/admin/productos",
    "/admin/productos/nuevo",
    "/admin/categorias",
    "/admin/configuracion",
  ]) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoViolations(page);
    });
  }

  await test.step("detalle de una consulta", async () => {
    await page.goto("/admin/consultas");
    await page.getByRole("link", { name: /^#/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page);
  });

  await test.step("edición de un producto", async () => {
    await page.goto("/admin/productos");
    await page
      .getByRole("link", { name: /Luna LED/ })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoViolations(page);
  });
});
