/**
 * Testes de componente — Scripts (/scripts e /scripts/[id]) — Phase 4
 *
 * Cobre:
 * 1. Renderiza lista de roteiros
 * 2. Exibe badge de status amigável
 * 3. Filtro de status exibido
 * 4. Filtro de nicho exibido
 * 5. Filtros de origem (IA/manual) exibidos
 * 6. Filtros de vínculo (com/sem Short) exibidos
 * 7. Empty state quando não há roteiros
 * 8. Botão "Criar Roteiro" visível
 * 9. Roteiro renderiza título
 * 10. Botão de excluir presente em cada card
 * 11. ScriptDetailPage — renderiza título do roteiro
 * 12. ScriptDetailPage — exibe linhas do roteiro (ScriptLineList)
 * 13. ScriptDetailPage — botão Editar presente
 * 14. ScriptDetailPage — botão Melhorar com IA presente
 * 15. ScriptDetailPage — ScriptVersionTimeline presente
 * 16. ScriptDetailPage — ScriptLinkedShortCard presente
 * 17. ScriptDetailPage — ScriptNextStepCard presente
 * 18. ScriptDetailPage — Por que a IA gerou este roteiro aparece (context_snapshot)
 * 19. ScriptDetailPage — editor se abre ao clicar em Editar
 * 20. ScriptDetailPage — editor tem botão salvar e cancelar
 * 21. ScriptDetailPage — cancelar fecha o editor
 * 22. ScriptDetailPage — header de volta para /scripts presente
 * 23. ScriptDetailPage — select de status presente
 * 24. ScriptDetailPage — exibe beat traduzido no ScriptLineCard
 */
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers";
import ScriptsPage from "@/app/scripts/page";
import ScriptDetailPage from "@/app/scripts/[id]/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scripts",
  useSearchParams: () => ({ get: () => null }),
  useParams: () => ({ id: "script-001" }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderList() {
  return renderWithProviders(<ScriptsPage />);
}

function renderDetail() {
  return renderWithProviders(<ScriptDetailPage />);
}

// ─── Listing Suite ────────────────────────────────────────────────────────────

describe("Scripts Page — listagem", () => {
  it("1. renderiza a lista de roteiros", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByText("Meus Roteiros")).toBeTruthy();
    });
  });

  it("2. exibe badge de status amigável (Rascunho)", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByText("Rascunho")).toBeTruthy();
    });
  });

  it("3. filtro de status está visível", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId("scripts-status-filter")).toBeTruthy();
    });
  });

  it("4. filtro de nicho está visível", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId("scripts-niche-filter")).toBeTruthy();
    });
  });

  it("5. filtros de origem (IA/manual) estão visíveis", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId("scripts-origin-ai")).toBeTruthy();
      expect(screen.getByTestId("scripts-origin-manual")).toBeTruthy();
    });
  });

  it("6. filtros de vínculo (com/sem Short) estão visíveis", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId("scripts-linked-yes")).toBeTruthy();
      expect(screen.getByTestId("scripts-linked-no")).toBeTruthy();
    });
  });

  it("7. empty state quando filtro de origem=manual não encontra roteiros IA", async () => {
    // O mockScript tem current_version.created_by = "ai_generation"
    // Ao filtrar por "manual", a lista fica vazia
    const user = userEvent.setup();
    renderList();

    const manualBtn = await screen.findByTestId("scripts-origin-manual");
    await user.click(manualBtn);

    await waitFor(() => {
      // Com origem=manual, nenhum card deve ser exibido
      expect(screen.queryAllByTestId("script-card-link").length).toBe(0);
    });
  });

  it("8. botão Criar Roteiro está visível", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByTestId("scripts-create-btn")).toBeTruthy();
    });
  });

  it("9. título do roteiro é exibido", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByText("Minecraft Hooks Test")).toBeTruthy();
    });
  });

  it("10. botão de excluir está presente em cada card", async () => {
    renderList();
    await waitFor(() => {
      const deleteBtns = screen.queryAllByTestId("script-delete-btn");
      expect(deleteBtns.length).toBeGreaterThan(0);
    });
  });
});

// ─── Detail Suite ─────────────────────────────────────────────────────────────

describe("Scripts Detail Page — visualização", () => {
  it("11. renderiza o título do roteiro", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText("Minecraft Hooks Test")).toBeTruthy();
    });
  });

  it("12. exibe linhas do roteiro", async () => {
    renderDetail();
    await waitFor(() => {
      const lines = screen.queryAllByTestId("script-line");
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  it("13. botão Editar manualmente presente", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-edit-btn")).toBeTruthy();
    });
  });

  it("14. botão Melhorar com IA presente", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-improve-btn")).toBeTruthy();
    });
  });

  it("15. histórico de versões presente", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-version-timeline")).toBeTruthy();
    });
  });

  it("16. ScriptLinkedShortCard presente", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-linked-short-card")).toBeTruthy();
    });
  });

  it("17. ScriptNextStepCard presente", async () => {
    renderDetail();
    await waitFor(() => {
      // Script is draft with no video → next-step-no-video
      expect(screen.getByTestId("next-step-no-video")).toBeTruthy();
    });
  });

  it("18. contexto da IA (Por que a IA gerou este roteiro) aparece", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-context-explanation")).toBeTruthy();
    });
  });

  it("22. link de volta para /scripts presente (header)", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-detail-header")).toBeTruthy();
    });
  });

  it("23. select de status presente no header", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("script-status-select")).toBeTruthy();
    });
  });

  it("24. beat traduzido aparece nas linhas (Gancho inicial)", async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText("Gancho inicial")).toBeTruthy();
    });
  });
});

describe("Scripts Detail Page — editor", () => {
  it("19. editor se abre ao clicar em Editar", async () => {
    const user = userEvent.setup();
    renderDetail();

    const editBtn = await screen.findByTestId("script-edit-btn");
    await user.click(editBtn);

    await waitFor(() => {
      expect(screen.getByTestId("script-editor")).toBeTruthy();
    });
  });

  it("20. editor tem botão salvar e cancelar", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByTestId("script-edit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("script-editor-save")).toBeTruthy();
      expect(screen.getByTestId("script-editor-cancel")).toBeTruthy();
    });
  });

  it("21. cancelar fecha o editor", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByTestId("script-edit-btn"));
    await screen.findByTestId("script-editor");

    await user.click(screen.getByTestId("script-editor-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("script-editor")).toBeNull();
    });
  });
});

describe("Scripts Detail Page — vínculo de Short", () => {
  it("abre o dialog de vincular Short ao clicar no botão", async () => {
    const user = userEvent.setup();
    renderDetail();

    const linkBtn = await screen.findByTestId("script-link-btn");
    await user.click(linkBtn);

    await waitFor(() => {
      expect(screen.getByTestId("script-link-input")).toBeTruthy();
    });
  });

  it("botão Vincular fica desabilitado sem ID", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByTestId("script-link-btn"));

    await waitFor(() => {
      const confirmBtn = screen.getByTestId("script-link-confirm") as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true);
    });
  });
});
