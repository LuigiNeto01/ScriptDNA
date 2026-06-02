/**
 * Testes de componente — Phase 6 (Dashboard Enriquecido, Analytics)
 *
 * Cobre:
 * 1.  /dashboard renderiza saudação do usuário
 * 2.  /dashboard exibe card "Próximo melhor passo"
 * 3.  /dashboard exibe grid de métricas
 * 4.  /dashboard exibe "Vídeos Analisados" nas métricas
 * 5.  /dashboard painel "Roteiros Recentes" visível
 * 6.  /dashboard exibe roteiro na lista
 * 7.  /dashboard painel "YoutubeStatusCard" visível
 * 8.  /dashboard painel "TopInsightsPanel" exibe aprendizado ativo
 * 9.  /dashboard painel "TopIdeasPanel" exibe sugestão
 * 10. /dashboard painel "RecentReferencesPanel" exibe vídeo de referência
 * 11. /analytics renderiza título "Analytics"
 * 12. /analytics exibe painel de métricas
 * 13. /analytics exibe card "Análise de Canal"
 * 14. /analytics exibe card "Identificação de Padrões"
 * 15. /analytics botão "Analisar Canal" presente
 * 16. /analytics botão "Identificar Padrões" presente
 * 17. /dashboard exibe empty state de roteiros quando sem roteiros
 * 18. /analytics exibe "Roteiros" na visão geral de métricas
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { mockScript, mockVideo, mockSuggestion } from "../mocks/handlers";
import DashboardPage from "@/app/page";
import AnalyticsPage from "@/app/analytics/page";
import { useOnboardingStore } from "@/stores/onboarding-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => ({ get: () => null }),
  useParams: () => ({}),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDashboard() {
  return renderWithProviders(<DashboardPage />);
}

function renderAnalytics() {
  return renderWithProviders(<AnalyticsPage />);
}

// ─── Dashboard Suite ──────────────────────────────────────────────────────────

describe("Dashboard Page — Phase 6", () => {
  beforeEach(() => {
    useOnboardingStore.getState().complete();
  });

  it("1. renderiza saudação do usuário", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/olá/i)).toBeTruthy();
    });
  });

  it("2. exibe card 'Próximo melhor passo'", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("next-best-action")).toBeTruthy();
    });
  });

  it("3. exibe grid de métricas", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-metric-grid")).toBeTruthy();
    });
  });

  it("4. exibe 'Vídeos Analisados' nas métricas", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/vídeos analisados/i)).toBeTruthy();
    });
  });

  it("5. painel 'Roteiros Recentes' visível", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("recent-scripts-panel")).toBeTruthy();
    });
  });

  it("6. exibe roteiro na lista", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(mockScript.title)).toBeTruthy();
    });
  });

  it("7. YoutubeStatusCard visível", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("youtube-status-card")).toBeTruthy();
    });
  });

  it("8. TopInsightsPanel exibe aprendizado ativo", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("top-insights-panel")).toBeTruthy();
      expect(screen.queryAllByTestId("top-insight-item").length).toBeGreaterThan(0);
    });
  });

  it("9. TopIdeasPanel exibe sugestão", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("top-ideas-panel")).toBeTruthy();
      expect(screen.getByText(mockSuggestion.title)).toBeTruthy();
    });
  });

  it("10. RecentReferencesPanel exibe vídeo de referência", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("recent-references-panel")).toBeTruthy();
      expect(screen.getByText(mockVideo.title)).toBeTruthy();
    });
  });

  it("17. exibe empty state de roteiros quando sem roteiros", async () => {
    server.use(
      http.get("http://localhost:8000/api/scripts", () => {
        return HttpResponse.json({ data: [] });
      })
    );
    renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText(/nenhum roteiro ainda/i)).toBeTruthy();
    });
  });
});

// ─── Analytics Suite ──────────────────────────────────────────────────────────

describe("Analytics Page — Phase 6", () => {
  it("11. renderiza título 'Analytics'", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText("Analytics")).toBeTruthy();
    });
  });

  it("12. exibe painel de métricas (analytics-metric-overview)", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-metric-overview")).toBeTruthy();
    });
  });

  it("13. exibe card 'Análise de Canal'", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByTestId("channel-analysis-card")).toBeTruthy();
    });
  });

  it("14. exibe card 'Identificação de Padrões'", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByTestId("pattern-discovery-card")).toBeTruthy();
    });
  });

  it("15. botão 'Analisar Canal' presente", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-analyze-btn")).toBeTruthy();
    });
  });

  it("16. botão 'Identificar Padrões' presente", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-patterns-btn")).toBeTruthy();
    });
  });

  it("18. exibe 'Roteiros' na visão geral de métricas", async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText("Roteiros")).toBeTruthy();
    });
  });
});
