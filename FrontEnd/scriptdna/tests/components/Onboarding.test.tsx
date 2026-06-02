/**
 * Testes do Onboarding Phase 2
 *
 * Cobre:
 * 1. Renderiza etapa 1 (boas-vindas)
 * 2. Avança para etapa 2 ao clicar "Começar configuração"
 * 3. Volta para etapa anterior
 * 4. Seleciona objetivo e botão Próximo fica habilitado
 * 5. Preenche nicho e avança
 * 6. Clica em chip de nicho
 * 7. Pula YouTube (skippedYoutube = true)
 * 8. Pula referências (skippedReferences = true)
 * 9. Checklist aparece quando há itens incompletos
 * 10. Banner de setup aparece quando onboarding incompleto
 * 11. reset() limpa todos os campos do store
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { ActivationChecklist, buildActivationChecklist } from "@/features/onboarding/ActivationChecklist";
import { SetupBanner } from "@/features/onboarding/SetupBanner";
import { GoalSelector } from "@/features/onboarding/components/GoalSelector";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import { useOnboardingStore } from "@/stores/onboarding-store";

// ─── Mock do Next.js router (necessário para OnboardingWizard) ─────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

const API_URL = "http://localhost:8000";

// Reset global antes de cada teste
beforeEach(() => {
  useOnboardingStore.getState().reset();
});

// ─── Helper para importar o wizard (após mock do router estar ativo) ───────
async function renderWizard() {
  const { OnboardingWizard } = await import(
    "@/features/onboarding/components/OnboardingWizard"
  );
  return renderWithProviders(<OnboardingWizard />);
}

describe("Onboarding — Wizard", () => {
  beforeEach(() => {
    server.use(
      http.get(`${API_URL}/api/youtube/channel`, () =>
        HttpResponse.json({ data: { connected: false, channel_id: null, channel_name: null } })
      ),
      http.get(`${API_URL}/api/videos`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${API_URL}/api/youtube/shorts`, () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 0, limit: 12 } })
      ),
      http.get(`${API_URL}/api/insights`, () =>
        HttpResponse.json({ data: { items: [], total: 0 } })
      ),
      http.get(`${API_URL}/api/suggestions`, () =>
        HttpResponse.json({ data: { items: [], total: 0 } })
      )
    );
  });

  it("1. Renderiza etapa 1 (boas-vindas)", async () => {
    await renderWizard();
    expect(screen.getByTestId("start-onboarding-btn")).toBeTruthy();
    expect(screen.getByText(/Começar configuração/i)).toBeTruthy();
  });

  it("2. Avança para etapa 2 ao clicar 'Começar configuração'", async () => {
    const user = userEvent.setup();
    await renderWizard();
    await user.click(screen.getByTestId("start-onboarding-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("goal-views")).toBeTruthy();
    });
  });

  it("3. Volta para etapa anterior", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().nextStep(); // etapa 2
    await renderWizard();
    const prevBtn = screen.getByTestId("onboarding-prev-btn");
    await user.click(prevBtn);
    await waitFor(() => {
      expect(screen.getByTestId("start-onboarding-btn")).toBeTruthy();
    });
  });

  it("4. Seleciona objetivo e botão 'Próximo' fica habilitado", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().nextStep(); // etapa 2
    await renderWizard();

    const nextBtn = screen.getByTestId("onboarding-next-btn");
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    await user.click(screen.getByTestId("goal-views"));
    await waitFor(() => {
      expect(nextBtn.hasAttribute("disabled")).toBe(false);
    });
    expect(useOnboardingStore.getState().goal).toBe("views");
  });

  it("5. Preenche nicho e botão 'Próximo' fica habilitado", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().nextStep(); // etapa 2
    useOnboardingStore.getState().nextStep(); // etapa 3
    await renderWizard();

    const input = screen.getByTestId("niche-input");
    await user.type(input, "Minecraft");

    await waitFor(() => {
      expect(useOnboardingStore.getState().niche).toBe("Minecraft");
    });

    const nextBtn = screen.getByTestId("onboarding-next-btn");
    expect(nextBtn.hasAttribute("disabled")).toBe(false);
  });

  it("6. Clica em chip de nicho e preenche o campo", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().nextStep();
    useOnboardingStore.getState().nextStep(); // etapa 3
    await renderWizard();

    await user.click(screen.getByTestId("niche-chip-Minecraft"));
    await waitFor(() => {
      expect(useOnboardingStore.getState().niche).toBe("Minecraft");
    });
  });

  it("7. Pula YouTube (skippedYoutube = true)", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setStep(3); // etapa 4: YouTube
    await renderWizard();

    await waitFor(() => {
      expect(screen.getByTestId("skip-youtube-btn")).toBeTruthy();
    });
    await user.click(screen.getByTestId("skip-youtube-btn"));

    await waitFor(() => {
      expect(useOnboardingStore.getState().skippedYoutube).toBe(true);
    });
  });

  it("8. Pula referências (skippedReferences = true)", async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setStep(4); // etapa 5: Referências
    await renderWizard();

    await waitFor(() => {
      expect(screen.getByTestId("skip-references-btn")).toBeTruthy();
    });
    await user.click(screen.getByTestId("skip-references-btn"));

    await waitFor(() => {
      expect(useOnboardingStore.getState().skippedReferences).toBe(true);
    });
  });
});

describe("Onboarding — Checklist de ativação", () => {
  it("9. Checklist aparece quando há itens incompletos", () => {
    const items = buildActivationChecklist({
      hasGoal: false,
      hasNiche: false,
      hasYouTube: false,
      hasShorts: false,
      hasReferences: false,
      hasScripts: false,
      hasInsights: false,
    });
    renderWithProviders(<ActivationChecklist items={items} />);
    expect(screen.getByText(/Configure sua conta/i)).toBeTruthy();
    expect(screen.getByText(/Conta criada/i)).toBeTruthy();
  });

  it("Checklist não aparece quando todos os itens estão completos", () => {
    const items = buildActivationChecklist({
      hasGoal: true,
      hasNiche: true,
      hasYouTube: true,
      hasShorts: true,
      hasReferences: true,
      hasScripts: true,
      hasInsights: true,
    });
    const { container } = renderWithProviders(<ActivationChecklist items={items} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Onboarding — SetupBanner", () => {
  it("10. Banner aparece quando onboarding não está completo", () => {
    renderWithProviders(
      <SetupBanner
        currentStep={0}
        goal={undefined}
        niche={undefined}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByTestId("setup-banner")).toBeTruthy();
    expect(screen.getByText(/Complete sua configuração inicial/i)).toBeTruthy();
  });

  it("Banner mostra goal e niche quando já foram preenchidos", () => {
    renderWithProviders(
      <SetupBanner
        currentStep={2}
        goal="views"
        niche="Minecraft"
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText(/Mais visualizações/i)).toBeTruthy();
    expect(screen.getByText(/Minecraft/i)).toBeTruthy();
  });
});

describe("Onboarding — GoalSelector", () => {
  it("Renderiza todas as 6 opções de objetivo", () => {
    renderWithProviders(<GoalSelector />);
    expect(screen.getByTestId("goal-views")).toBeTruthy();
    expect(screen.getByTestId("goal-retention")).toBeTruthy();
    expect(screen.getByTestId("goal-subscribers")).toBeTruthy();
    expect(screen.getByTestId("goal-comments")).toBeTruthy();
    expect(screen.getByTestId("goal-conversions")).toBeTruthy();
    expect(screen.getByTestId("goal-consistency")).toBeTruthy();
  });

  it("Seleciona objetivo ao clicar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GoalSelector />);
    await user.click(screen.getByTestId("goal-retention"));
    expect(useOnboardingStore.getState().goal).toBe("retention");
  });
});

describe("Onboarding — Store (persistência local)", () => {
  it("11. reset() limpa todos os campos do store", () => {
    const store = useOnboardingStore.getState();
    store.setGoal("views");
    store.setNiche("Minecraft");
    store.complete();

    // Confirma que foram definidos
    expect(useOnboardingStore.getState().goal).toBe("views");
    expect(useOnboardingStore.getState().completed).toBe(true);

    // Reset
    store.reset();

    expect(useOnboardingStore.getState().completed).toBe(false);
    expect(useOnboardingStore.getState().goal).toBeUndefined();
    expect(useOnboardingStore.getState().niche).toBeUndefined();
    expect(useOnboardingStore.getState().currentStep).toBe(0);
  });

  it("setGoal e setNiche salvam no estado corretamente", () => {
    const store = useOnboardingStore.getState();
    store.setGoal("subscribers");
    store.setNiche("Finanças");

    expect(useOnboardingStore.getState().goal).toBe("subscribers");
    expect(useOnboardingStore.getState().niche).toBe("Finanças");
  });
});

describe("Onboarding — OnboardingProgress", () => {
  it("Renderiza barra de progresso com step correto", () => {
    renderWithProviders(<OnboardingProgress currentStep={2} />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByText(/3 de 6/i)).toBeTruthy();
  });
});
