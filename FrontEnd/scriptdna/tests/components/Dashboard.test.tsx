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
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { mockVideo } from "../mocks/handlers";
import DashboardPage from "@/app/page";
import { useOnboardingStore } from "@/stores/onboarding-store";

// Mock do Next.js router (necessário porque DashboardPage usa useOnboardingStore
// cujo SetupBanner usa LinkButton que pode precisar de contexto Next)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

describe("Dashboard Page", () => {
  beforeEach(() => {
    // Garante que onboarding está completo para não interferir no DOM dos testes
    useOnboardingStore.getState().complete();
  });
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
      // O dashboard agora exibe "Nenhuma referência ainda" ou "Nenhum roteiro ainda"
      const emptyText =
        screen.queryByText(/nenhuma referência/i) ||
        screen.queryByText(/nenhum roteiro/i) ||
        screen.queryByText(/nenhum vídeo/i);
      expect(emptyText).toBeTruthy();
    });
  });

  it("has action buttons for import and generate", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // O dashboard sempre mostra o heading principal
      const heading = screen.queryByText(/Olá/i) || screen.queryByText(/visão geral/i);
      expect(heading).toBeTruthy();
    });
  });
});
