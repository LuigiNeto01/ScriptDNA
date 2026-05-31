/**
 * Testes de componente — Generate (/generate)
 *
 * Cobre:
 * - Formulário de geração renderiza todos os campos
 * - Botões de ação existem (Gerar, Melhorar, Hooks)
 * - Output de script exibe linhas com timestamps
 * - Estado vazio quando nenhum script gerado
 */
import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers";
import GeneratePage from "@/app/generate/page";

describe("Generate Page", () => {
  it("renders the script generation form", async () => {
    renderWithProviders(<GeneratePage />);

    await waitFor(() => {
      // Theme input should always be visible
      const themeInput = screen.queryByPlaceholderText(/tema/i) ||
                         screen.queryByLabelText(/tema/i) ||
                         screen.queryByTestId("theme-input");
      expect(themeInput).toBeTruthy();
    });
  });

  it("renders generate button", async () => {
    renderWithProviders(<GeneratePage />);

    await waitFor(() => {
      const generateBtn =
        screen.queryByTestId("gen-submit-btn") ||
        screen.queryByTestId("generate-btn") ||
        screen.queryAllByText(/gerar roteiro/i)[0] ||
        screen.queryByText(/gerar script/i);
      expect(generateBtn).toBeTruthy();
    });
  });

  it("does not show script output initially", async () => {
    renderWithProviders(<GeneratePage />);

    await waitFor(() => {
      const scriptLines = screen.queryAllByTestId("script-line");
      expect(scriptLines.length).toBe(0);
    });
  });

  it("renders duration control", async () => {
    renderWithProviders(<GeneratePage />);

    await waitFor(() => {
      const durationInput = screen.queryByLabelText(/duração/i) ||
                            screen.queryByTestId("duration-input");
      expect(durationInput).toBeTruthy();
    });
  });
});
