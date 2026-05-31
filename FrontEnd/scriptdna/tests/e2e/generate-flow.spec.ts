/**
 * E2E — Fluxo: Selecionar estilo -> gerar roteiro -> visualizar com minutagem
 *
 * Fluxo crítico #2.
 */
import { test, expect } from "@playwright/test";

test.describe("Generate Flow", () => {
  test("generate script form has all required fields", async ({ page }) => {
    await page.goto("/generate");

    // Campos obrigatórios devem existir
    await expect(
      page.getByPlaceholder(/tema/i).or(page.getByLabel(/tema/i)).or(page.getByTestId("theme-input"))
    ).toBeVisible();

    await expect(
      page.getByLabel(/duração/i).or(page.getByTestId("duration-input"))
    ).toBeVisible();
  });

  test("generate button is clickable", async ({ page }) => {
    await page.goto("/generate");

    const btn =
      page.getByText(/gerar roteiro/i).or(page.getByText(/gerar script/i)).or(page.getByTestId("generate-btn"));
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("library page loads and shows search", async ({ page }) => {
    await page.goto("/library");

    await expect(page.getByTestId("search-input")).toBeVisible();
  });
});
