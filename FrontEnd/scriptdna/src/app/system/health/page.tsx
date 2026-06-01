"use client";

import { useDetailedHealth, useAiCosts, useAiRuns } from "@/hooks/use-observability";
import { SystemHealthStatus } from "@/components/observability/system-health-status";
import { AgentRunTable } from "@/components/observability/agent-run-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Activity, XCircle } from "lucide-react";

function formatUsd(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value === 0) return "$0.00";
  return `$${value.toFixed(2)}`;
}

export default function SystemHealthPage() {
  const health = useDetailedHealth();
  const costs = useAiCosts(1); // today
  const recentErrors = useAiRuns({ limit: 5 });

  const errorRuns = recentErrors.data?.filter((r) => r.status === "error") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Status do Sistema</h1>
        <p className="text-muted-foreground">
          Monitoramento de servicos, custos e erros recentes.
        </p>
      </div>

      <SystemHealthStatus
        data={health.data}
        isLoading={health.isLoading}
        isError={health.isError}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custo Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUsd(costs.data?.total_cost_usd)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {costs.data?.total_runs ?? 0} runs hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Runs Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costs.data?.total_runs ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {costs.data?.error_runs ?? 0} com erro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Erros Recentes</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRuns.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {errorRuns.length > 0
                ? `Ultimo: ${errorRuns[0]?.agent_name}`
                : "Nenhum erro recente"}
            </p>
          </CardContent>
        </Card>
      </div>

      {errorRuns.length > 0 && (
        <AgentRunTable
          data={errorRuns}
          isLoading={recentErrors.isLoading}
          isError={recentErrors.isError}
          title="Ultimos Erros"
          description="Execucoes com falha recentes"
        />
      )}
    </div>
  );
}
