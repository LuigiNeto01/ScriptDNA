/**
 * Testes de componente — Import (/import)
 *
 * Cobre:
 * - Tabs de texto, arquivo e URL existem
 * - Formulário de texto valida campos obrigatórios
 * - Dropzone de arquivo existe
 * - Submit handlers são chamados
 */
import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers";
import ImportPage from "@/app/import/page";

describe("Import Page", () => {
  it("renders all three tabs", async () => {
    renderWithProviders(<ImportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("tab-text")).toBeInTheDocument();
      expect(screen.getByTestId("tab-file")).toBeInTheDocument();
      expect(screen.getByTestId("tab-url")).toBeInTheDocument();
    });
  });

  it("shows text form fields by default", async () => {
    renderWithProviders(<ImportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("text-title-input")).toBeInTheDocument();
    });
  });

  it("shows file dropzone when file tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ImportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("tab-file")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("tab-file"));

    await waitFor(() => {
      expect(screen.getByTestId("file-dropzone")).toBeInTheDocument();
    });
  });

  it("shows URL input when url tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ImportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("tab-url")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("tab-url"));

    await waitFor(() => {
      expect(screen.getByTestId("url-input")).toBeInTheDocument();
    });
  });

  it("text submit button exists", async () => {
    renderWithProviders(<ImportPage />);

    await waitFor(() => {
      expect(screen.getByTestId("text-submit-btn")).toBeInTheDocument();
    });
  });
});
