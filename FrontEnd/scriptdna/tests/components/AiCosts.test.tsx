import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers";
import { AiCostSummaryCards } from "@/components/observability/ai-cost-summary-cards";
import { AgentRunTable } from "@/components/observability/agent-run-table";
import { SystemHealthStatus } from "@/components/observability/system-health-status";
import { CostByAgentTable } from "@/components/observability/cost-by-agent-table";
import {
  mockAiCostSummary,
  mockAiRuns,
  mockHealthDetailed,
} from "../mocks/handlers";

// ============================================================
// AiCostSummaryCards
// ============================================================

describe("AiCostSummaryCards", () => {
  it("renders loading state", () => {
    renderWithProviders(
      <AiCostSummaryCards data={undefined} isLoading={true} isError={false} />
    );
    // Should show loading spinners
    expect(document.querySelectorAll(".animate-spin").length).toBeGreaterThan(0);
  });

  it("renders error state", () => {
    renderWithProviders(
      <AiCostSummaryCards data={undefined} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Erro ao carregar custos de IA")).toBeDefined();
  });

  it("renders cost data", () => {
    renderWithProviders(
      <AiCostSummaryCards
        data={mockAiCostSummary}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("$1.85")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("125.0K")).toBeDefined();
  });

  it("shows unknown cost runs count", () => {
    renderWithProviders(
      <AiCostSummaryCards
        data={mockAiCostSummary}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("Runs sem tokens retornados")).toBeDefined();
  });

  it("shows most expensive agent", () => {
    renderWithProviders(
      <AiCostSummaryCards
        data={mockAiCostSummary}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("ScriptGeneratorAgent")).toBeDefined();
  });
});

// ============================================================
// AgentRunTable
// ============================================================

describe("AgentRunTable", () => {
  it("renders empty state", () => {
    renderWithProviders(
      <AgentRunTable data={[]} isLoading={false} isError={false} />
    );
    expect(
      screen.getByText("Nenhuma execucao registrada")
    ).toBeDefined();
  });

  it("renders run data with status badges", () => {
    renderWithProviders(
      <AgentRunTable data={mockAiRuns} isLoading={false} isError={false} />
    );

    expect(screen.getByText("ScriptGeneratorAgent")).toBeDefined();
    expect(screen.getByText("PerformanceAnalysisAgent")).toBeDefined();
    expect(screen.getByText("Sucesso")).toBeDefined();
    expect(screen.getByText("Erro")).toBeDefined();
  });

  it("shows error message for failed runs", () => {
    renderWithProviders(
      <AgentRunTable data={mockAiRuns} isLoading={false} isError={false} />
    );
    expect(
      screen.getByText("Timeout ao analisar performance")
    ).toBeDefined();
  });

  it("shows unknown cost as Desconhecido", () => {
    renderWithProviders(
      <AgentRunTable data={mockAiRuns} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Desconhecido")).toBeDefined();
  });

  it("renders loading state", () => {
    renderWithProviders(
      <AgentRunTable data={undefined} isLoading={true} isError={false} />
    );
    expect(document.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    renderWithProviders(
      <AgentRunTable data={undefined} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Erro ao carregar execucoes")).toBeDefined();
  });
});

// ============================================================
// SystemHealthStatus
// ============================================================

describe("SystemHealthStatus", () => {
  it("renders health check items", () => {
    renderWithProviders(
      <SystemHealthStatus
        data={mockHealthDetailed}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText("Banco de dados")).toBeDefined();
    expect(screen.getByText("Redis")).toBeDefined();
    expect(screen.getByText("OpenAI / LLM")).toBeDefined();
    expect(screen.getByText("YouTube OAuth")).toBeDefined();
  });

  it("shows Todos OK when all checks pass", () => {
    renderWithProviders(
      <SystemHealthStatus
        data={mockHealthDetailed}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Todos OK")).toBeDefined();
  });

  it("shows not configured for missing services", () => {
    renderWithProviders(
      <SystemHealthStatus
        data={mockHealthDetailed}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Nao configurado")).toBeDefined();
  });

  it("renders loading state", () => {
    renderWithProviders(
      <SystemHealthStatus data={undefined} isLoading={true} isError={false} />
    );
    expect(document.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    renderWithProviders(
      <SystemHealthStatus data={undefined} isLoading={false} isError={true} />
    );
    expect(
      screen.getByText("Erro ao verificar status do sistema")
    ).toBeDefined();
  });
});

// ============================================================
// CostByAgentTable
// ============================================================

describe("CostByAgentTable", () => {
  it("renders agent cost breakdown", () => {
    renderWithProviders(
      <CostByAgentTable agents={mockAiCostSummary.by_agent} />
    );
    expect(screen.getByText("ScriptGeneratorAgent")).toBeDefined();
    expect(screen.getByText("PerformanceAnalysisAgent")).toBeDefined();
    expect(screen.getByText("LearningMemoryAgent")).toBeDefined();
  });

  it("renders nothing when no agents", () => {
    const { container } = renderWithProviders(
      <CostByAgentTable agents={[]} />
    );
    expect(container.innerHTML).toBe("");
  });
});
