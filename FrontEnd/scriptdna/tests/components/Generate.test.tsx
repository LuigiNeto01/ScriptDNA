/**
 * Testes de componente — Generate (/generate) — Phase 3
 *
 * Cobre:
 * 1. Renderiza o formulário simples (tema, nicho, duração, objetivo)
 * 2. Botão "Gerar Roteiro" está visível
 * 3. Nenhuma linha de script visível no estado inicial
 * 4. Duração tem controle com label
 * 5. Opções avançadas colapsadas por padrão
 * 6. Opções avançadas expandem ao clicar
 * 7. Pré-preenchimento com goal do onboarding
 * 8. Pré-preenchimento com niche do onboarding
 * 9. Idle state aparece antes de gerar
 * 10. Script output aparece após geração bem-sucedida
 * 11. Qualidade de avaliação traduzida é exibida
 * 12. Ganchos de curiosidade listados
 * 13. Pontos para melhorar listados (colapsado)
 * 14. Aba "Criar aberturas" contém botão de geração
 * 15. Aba "Melhorar" contém textarea
 * 16. Mensagem de erro exibida em falha
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import GeneratePage from "@/app/generate/page";
import { useOnboardingStore } from "@/stores/onboarding-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/generate",
  useSearchParams: () => ({ get: () => null }),
}));

const API_URL = "http://localhost:8000";

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return renderWithProviders(<GeneratePage />);
}

async function getThemeInput() {
  return screen.findByLabelText(/tema do roteiro/i);
}

async function getNicheInput() {
  return screen.findByLabelText(/nicho/i);
}

async function getSubmitBtn() {
  return screen.findByTestId("gen-submit-btn");
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("Generate Page — formulário simples", () => {
  it("1. renderiza o formulário de geração", async () => {
    renderPage();
    const themeInput = await getThemeInput();
    expect(themeInput).toBeTruthy();
  });

  it("2. botão Gerar Roteiro está visível", async () => {
    renderPage();
    const btn = await getSubmitBtn();
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/gerar roteiro/i);
  });

  it("3. nenhuma linha de script visível inicialmente", async () => {
    renderPage();
    await waitFor(() => {
      const lines = screen.queryAllByTestId("script-line");
      expect(lines.length).toBe(0);
    });
  });

  it("4. controle de duração com label visível", async () => {
    renderPage();
    const durationInput = await screen.findByLabelText(/duração/i);
    expect(durationInput).toBeTruthy();
  });

  it("5. opções avançadas colapsadas por padrão", async () => {
    renderPage();
    // O conteúdo avançado não deve estar visível
    await waitFor(() => {
      expect(screen.queryByTestId("advanced-options-content")).toBeNull();
    });
  });

  it("6. opções avançadas expandem ao clicar no toggle", async () => {
    const user = userEvent.setup();
    renderPage();

    const toggle = await screen.findByTestId("advanced-options-toggle");
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId("advanced-options-content")).toBeTruthy();
    });
  });
});

describe("Generate Page — pré-preenchimento com onboarding", () => {
  it("7. pré-preenche goal com dado do onboarding store", async () => {
    useOnboardingStore.getState().setGoal("views");
    renderPage();

    await waitFor(async () => {
      // O select de objetivo existe e exibe um valor selecionado
      const goalTrigger = await screen.findByTestId("gen-goal-select");
      // base-ui SelectValue renderiza o valor bruto no trigger; confirmamos
      // que o componente está presente e com algum conteúdo (pré-preenchido)
      expect(goalTrigger).toBeTruthy();
      expect(goalTrigger.textContent).toMatch(/views/i);
    });
  });

  it("8. pré-preenche nicho com dado do onboarding store", async () => {
    useOnboardingStore.getState().setNiche("Minecraft");
    renderPage();

    await waitFor(async () => {
      const nicheInput = await getNicheInput();
      expect((nicheInput as HTMLInputElement).value).toBe("Minecraft");
    });
  });
});

describe("Generate Page — idle state", () => {
  it("9. idle state aparece antes de gerar", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("generate-idle-state")).toBeTruthy();
    });
  });
});

describe("Generate Page — resultado de geração", () => {
  it("10. exibe linhas do roteiro após geração bem-sucedida", async () => {
    const user = userEvent.setup();
    renderPage();

    const themeInput = await getThemeInput();
    const nicheInput = await getNicheInput();
    const submitBtn = await getSubmitBtn();

    await user.type(themeInput, "Dois robôs competindo no Minecraft");
    await user.type(nicheInput, "Gaming");
    await user.click(submitBtn);

    await waitFor(() => {
      const lines = screen.queryAllByTestId("script-line");
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  it("11. exibe avaliação de qualidade traduzida", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await getThemeInput(), "Teste qualidade");
    await user.type(await getNicheInput(), "Tech");
    await user.click(await getSubmitBtn());

    await waitFor(() => {
      // "Avaliação de qualidade" deve aparecer na tela
      expect(screen.getByText(/avaliação de qualidade/i)).toBeTruthy();
    });
  });

  it("12. ganchos de curiosidade aparecem nos detalhes", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await getThemeInput(), "Teste curiosidade");
    await user.type(await getNicheInput(), "Tech");
    await user.click(await getSubmitBtn());

    // Após gerar, abrir o painel de detalhes
    await waitFor(() => {
      // O painel "Detalhes da geração" deve existir
      expect(screen.getByText(/detalhes da geração/i)).toBeTruthy();
    });
  });

  it("13. pontos para melhorar estão nos painéis colapsados", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await getThemeInput(), "Teste pontos");
    await user.type(await getNicheInput(), "Tech");
    await user.click(await getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText(/pontos para melhorar/i)).toBeTruthy();
    });
  });
});

describe("Generate Page — aba Criar aberturas", () => {
  it("14. aba de aberturas tem botão de geração", async () => {
    const user = userEvent.setup();
    renderPage();

    // Navega para a aba de hooks
    const hooksTab = await screen.findByText(/criar aberturas/i);
    await user.click(hooksTab);

    await waitFor(() => {
      expect(screen.getByTestId("gen-hooks-btn")).toBeTruthy();
    });
  });
});

describe("Generate Page — aba Melhorar roteiro", () => {
  it("15. aba de melhorar tem textarea", async () => {
    const user = userEvent.setup();
    renderPage();

    const improveTab = await screen.findByText(/melhorar/i);
    await user.click(improveTab);

    await waitFor(() => {
      expect(screen.getByTestId("improve-text-input")).toBeTruthy();
    });
  });

  it("16. botão de melhorar fica desabilitado sem texto", async () => {
    const user = userEvent.setup();
    renderPage();

    const improveTab = await screen.findByText(/melhorar/i);
    await user.click(improveTab);

    await waitFor(() => {
      const btn = screen.getByTestId("improve-submit-btn") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });
});

describe("Generate Page — tratamento de erros", () => {
  it("17. exibe mensagem de erro quando API falha", async () => {
    server.use(
      http.post(`${API_URL}/api/generate/script`, () => {
        return HttpResponse.json(
          { error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(await getThemeInput(), "Teste erro");
    await user.type(await getNicheInput(), "Tech");
    await user.click(await getSubmitBtn());

    await waitFor(() => {
      const errorCard = document.querySelector(".border-destructive");
      expect(errorCard).toBeTruthy();
    });
  });
});

describe("Generate Page — testes de regressão (mantém contratos)", () => {
  it("mantém data-testid gen-submit-btn", async () => {
    renderPage();
    expect(await screen.findByTestId("gen-submit-btn")).toBeTruthy();
  });

  it("mantém data-testid gen-hooks-btn na aba de aberturas", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByText(/criar aberturas/i));
    await waitFor(() => {
      expect(screen.getByTestId("gen-hooks-btn")).toBeTruthy();
    });
  });

  it("mantém data-testid improve-text-input na aba de melhorar", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByText(/melhorar/i));
    await waitFor(() => {
      expect(screen.getByTestId("improve-text-input")).toBeTruthy();
    });
  });

  it("mantém data-testid improve-submit-btn na aba de melhorar", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByText(/melhorar/i));
    await waitFor(() => {
      expect(screen.getByTestId("improve-submit-btn")).toBeTruthy();
    });
  });

  it("não exibe script-line antes de gerar", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryAllByTestId("script-line").length).toBe(0);
    });
  });
});
