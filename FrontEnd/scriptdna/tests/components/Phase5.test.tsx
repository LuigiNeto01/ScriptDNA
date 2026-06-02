/**
 * Testes de componente — Phase 5 (Insights, Ideas, Strategy, Generate params)
 *
 * Cobre:
 * 1.  /insights renderiza "Aprendizados"
 * 2.  /insights exibe insight card
 * 3.  /insights exibe badge de categoria traduzida (Abertura)
 * 4.  /insights exibe botão "Aplicar em novo roteiro"
 * 5.  /insights filtros de grupo estão visíveis
 * 6.  /insights filtro "O que evitar" exibe apenas insights negativos
 * 7.  /insights filtro de categoria está visível
 * 8.  /insights exibe seção "O que repetir"
 * 9.  /ideas renderiza "Próximos Vídeos"
 * 10. /ideas exibe SuggestionCard
 * 11. /ideas exibe badge de prioridade amigável (Alto potencial)
 * 12. /ideas exibe botão "Criar roteiro com essa ideia"
 * 13. /ideas filtro de potencial está visível
 * 14. /ideas filtro de status está visível
 * 15. /strategy renderiza "Estratégia da semana"
 * 16. /strategy exibe TrendCard
 * 17. /strategy botão "Gerar estratégia semanal" presente
 * 18. /strategy TrendCard tem botão "Gerar roteiro sobre isso"
 * 19. /generate lê param theme da URL
 * 20. /generate lê param niche da URL
 * 21. /generate lê param idea da URL sem quebrar o formulário
 */
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers";
import InsightsPage from "@/app/insights/page";
import IdeasPage from "@/app/ideas/page";
import StrategyPage from "@/app/strategy/page";
import GeneratePage from "@/app/generate/page";

// Mutable searchParams mock for generate tests
let mockSearchParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/insights",
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
  useParams: () => ({}),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderInsights() {
  mockSearchParams = {};
  return renderWithProviders(<InsightsPage />);
}

function renderIdeas() {
  mockSearchParams = {};
  return renderWithProviders(<IdeasPage />);
}

function renderStrategy() {
  mockSearchParams = {};
  return renderWithProviders(<StrategyPage />);
}

function renderGenerate(params: Record<string, string> = {}) {
  mockSearchParams = params;
  return renderWithProviders(<GeneratePage />);
}

// ─── Insights Suite ───────────────────────────────────────────────────────────

describe("Insights Page", () => {
  it("1. renderiza 'Aprendizados'", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Aprendizados")).toBeTruthy();
    });
  });

  it("2. exibe insight card", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.queryAllByTestId("insight-card").length).toBeGreaterThan(0);
    });
  });

  it("3. exibe badge de categoria traduzida (Abertura)", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Abertura")).toBeTruthy();
    });
  });

  it("4. exibe botão 'Aplicar em novo roteiro'", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.queryAllByTestId("insight-apply-btn").length).toBeGreaterThan(0);
    });
  });

  it("5. filtros de grupo estão visíveis", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByTestId("insights-group-positive")).toBeTruthy();
      expect(screen.getByTestId("insights-group-negative")).toBeTruthy();
    });
  });

  it("6. filtro 'O que evitar' exibe somente insights negativos", async () => {
    const user = userEvent.setup();
    renderInsights();

    const negativeBtn = await screen.findByTestId("insights-group-negative");
    await user.click(negativeBtn);

    await waitFor(() => {
      // Com filtro "negative", apenas o mockInsightNegative (sentiment=negative) aparece
      const cards = screen.queryAllByTestId("insight-card");
      expect(cards.length).toBe(1);
    });
  });

  it("7. filtro de categoria está visível", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByTestId("insights-category-filter")).toBeTruthy();
    });
  });

  it("8. exibe seção 'O que repetir'", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("O que repetir")).toBeTruthy();
    });
  });
});

// ─── Ideas Suite ──────────────────────────────────────────────────────────────

describe("Ideas Page", () => {
  it("9. renderiza 'Próximos Vídeos'", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.getByText("Próximos Vídeos")).toBeTruthy();
    });
  });

  it("10. exibe SuggestionCard", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.queryAllByTestId("suggestion-card").length).toBeGreaterThan(0);
    });
  });

  it("11. exibe badge 'Alto potencial'", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.getByText("Alto potencial")).toBeTruthy();
    });
  });

  it("12. exibe botão 'Criar roteiro com essa ideia'", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.queryAllByTestId("suggestion-convert-btn").length).toBeGreaterThan(0);
    });
  });

  it("13. filtro de potencial está visível", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.getByTestId("ideas-category-filter")).toBeTruthy();
    });
  });

  it("14. filtro de status está visível", async () => {
    renderIdeas();
    await waitFor(() => {
      expect(screen.getByTestId("ideas-status-filter")).toBeTruthy();
    });
  });
});

// ─── Strategy Suite ───────────────────────────────────────────────────────────

describe("Strategy Page", () => {
  it("15. renderiza 'Estratégia da semana'", async () => {
    renderStrategy();
    await waitFor(() => {
      expect(screen.getByText("Estratégia da semana")).toBeTruthy();
    });
  });

  it("16. exibe TrendCard", async () => {
    renderStrategy();
    await waitFor(() => {
      expect(screen.queryAllByTestId("trend-card").length).toBeGreaterThan(0);
    });
  });

  it("17. botão 'Gerar estratégia semanal' presente", async () => {
    renderStrategy();
    await waitFor(() => {
      expect(screen.getByTestId("strategy-generate-btn")).toBeTruthy();
    });
  });

  it("18. TrendCard tem botão 'Gerar roteiro sobre isso'", async () => {
    renderStrategy();
    await waitFor(() => {
      expect(screen.queryAllByTestId("trend-generate-btn").length).toBeGreaterThan(0);
    });
  });
});

// ─── Generate params Suite ────────────────────────────────────────────────────

describe("Generate Page — query params prefill", () => {
  it("19. lê param theme da URL", async () => {
    renderGenerate({ theme: "Minecraft pvp" });
    await waitFor(async () => {
      const input = await screen.findByLabelText(/tema do roteiro/i);
      expect((input as HTMLInputElement).value).toBe("Minecraft pvp");
    });
  });

  it("20. lê param niche da URL", async () => {
    renderGenerate({ niche: "Gaming" });
    await waitFor(async () => {
      const input = await screen.findByLabelText(/nicho/i);
      expect((input as HTMLInputElement).value).toBe("Gaming");
    });
  });

  it("21. lê param idea da URL sem quebrar o formulário", async () => {
    renderGenerate({ idea: "Top 5 erros do Minecraft" });
    await waitFor(() => {
      expect(screen.getByTestId("gen-submit-btn")).toBeTruthy();
    });
  });
});
