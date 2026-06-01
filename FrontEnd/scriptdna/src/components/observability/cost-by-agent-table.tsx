"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AiCostByAgent } from "@/types/api";

function formatUsd(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function CostByAgentTable({
  agents,
}: {
  agents: AiCostByAgent[] | undefined;
}) {
  if (!agents?.length) return null;

  const maxCost = Math.max(...agents.map((a) => a.cost_usd), 0.001);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custo por Agente</CardTitle>
        <CardDescription>Distribuicao de custo entre agentes de IA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="cost-by-agent">
          {agents.map((agent) => (
            <div key={agent.agent} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{agent.agent}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{agent.runs} runs</span>
                  <span>{formatTokens(agent.tokens)} tokens</span>
                  <span className="font-medium text-foreground">
                    {formatUsd(agent.cost_usd)}
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.max((agent.cost_usd / maxCost) * 100, 2)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
