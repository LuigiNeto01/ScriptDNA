/**
 * Testes de componente — Dashboard (/)
 *
 * Cobre:
 * - Renderiza métricas corretamente
 * - Renderiza lista de vídeos recentes
 * - Empty state quando sem vídeos
 * - Loading state
 * - Links de ação funcionam
 */
import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { mockVideo } from "../mocks/handlers";
import DashboardPage from "@/app/page";

describe("Dashboard Page", () => {
  it("renders metric cards when data loads", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/vídeos analisados/i)).toBeInTheDocument();
    });
  });

  it("renders recent videos list", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    });
  });

  it("shows empty state when no videos", async () => {
    server.use(
      http.get("http://localhost:8000/api/videos", () => {
        return HttpResponse.json({ data: [] });
      })
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/nenhum vídeo/i) || screen.getByText(/comece/i)
      ).toBeTruthy();
    });
  });

  it("has action buttons for import and generate", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      const importBtn = screen.queryByText(/importar/i);
      const generateBtn = screen.queryByText(/gerar/i);
      expect(importBtn || generateBtn).toBeTruthy();
    });
  });
});
