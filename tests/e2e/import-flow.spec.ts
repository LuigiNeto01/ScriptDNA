/**
 * E2E — Fluxo: Upload de texto -> análise -> visualizar timeline
 *
 * Fluxo crítico #1: Se quebrar, a aplicação é inútil.
 */
import { test, expect } from "@playwright/test";

test.describe("Import Flow", () => {
  test("submit text and see processing status", async ({ page }) => {
    await page.goto("/import");

    // Tab de texto deve estar ativa por padrão
    await expect(page.getByTestId("tab-text")).toBeVisible();
    await expect(page.getByTestId("text-title-input")).toBeVisible();

    // Preencher formulário
    await page.getByTestId("text-title-input").fill("Meu Vídeo de Teste");
    const textArea =
      page.getByTestId("text-textarea") ||
      page.locator("textarea").first();
    await textArea.fill(
      "Este é um roteiro de teste para análise de retenção de audiência. " +
        "Vamos ver como o sistema classifica os beats narrativos e identifica técnicas."
    );

    // Submeter
    await page.getByTestId("text-submit-btn").click();

    // Deve mostrar status de processamento ou redirecionar
    await expect(
      page.getByText(/processando/i).or(page.getByText(/pendente/i)).or(page.getByText(/pending/i))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("file tab shows dropzone", async ({ page }) => {
    await page.goto("/import");

    await page.getByTestId("tab-file").click();
    await expect(page.getByTestId("file-dropzone")).toBeVisible();
  });

  test("url tab shows url input", async ({ page }) => {
    await page.goto("/import");

    await page.getByTestId("tab-url").click();
    await expect(page.getByTestId("url-input")).toBeVisible();
  });
});
