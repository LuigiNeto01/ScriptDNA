"use client";

import { useState } from "react";
import { useAiCosts, useAiRuns } from "@/hooks/use-observability";
import { AiCostSummaryCards } from "@/components/observability/ai-cost-summary-cards";
import { AgentRunTable } from "@/components/observability/agent-run-table";
import { CostByAgentTable } from "@/components/observability/cost-by-agent-table";
import { Button } from "@/components/ui/button";

const PERIOD_OPTIONS = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
];

export default function AiCostsPage() {
  const [days, setDays] = useState(30);
  const costs = useAiCosts(days);
  const runs = useAiRuns({ limit: 30 });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custos de IA</h1>
          <p className="text-muted-foreground">
            Rastreamento de custos, tokens e execucoes de agentes.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={days === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <AiCostSummaryCards
        data={costs.data}
        isLoading={costs.isLoading}
        isError={costs.isError}
      />

      <CostByAgentTable agents={costs.data?.by_agent} />

      <AgentRunTable
        data={runs.data}
        isLoading={runs.isLoading}
        isError={runs.isError}
        title="Execucoes Recentes"
        description="Ultimas 30 execucoes de agentes de IA"
      />
    </div>
  );
}
