/**
 * E2E — Navegação básica entre páginas
 *
 * Garante que todas as rotas principais são acessíveis.
 */
import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/scriptdna/i);
  });

  test("import page loads", async ({ page }) => {
    await page.goto("/import");
    await expect(page.getByTestId("tab-text")).toBeVisible();
  });

  test("library page loads", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByTestId("search-input")).toBeVisible();
  });

  test("generate page loads", async ({ page }) => {
    await page.goto("/generate");
    await expect(
      page.getByText(/gerar/i).first()
    ).toBeVisible();
  });

  test("styles page loads", async ({ page }) => {
    await page.goto("/styles");
    await expect(page.getByText(/estilo/i).or(page.getByText(/perfil/i)).first()).toBeVisible();
  });
});
