"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, DollarSign, Cpu, Zap, Hash, AlertTriangle, Activity } from "lucide-react";
import type { AiCostSummary } from "@/types/api";

function formatUsd(value: number | null | undefined): string {
  if (value == null) return "Desconhecido";
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function CostCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AiCostSummaryCards({
  data,
  isLoading,
  isError,
}: {
  data: AiCostSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar custos de IA</span>
        </CardContent>
      </Card>
    );
  }

  const mostExpensive = data?.by_agent?.length
    ? data.by_agent.reduce((a, b) => (a.cost_usd > b.cost_usd ? a : b))
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <CostCard
        title="Custo Total"
        value={formatUsd(data?.total_cost_usd)}
        icon={DollarSign}
        description={`Ultimos ${data?.period_days ?? 30} dias`}
      />
      <CostCard
        title="Runs Totais"
        value={String(data?.total_runs ?? 0)}
        icon={Activity}
        description={
          data?.error_runs
            ? `${data.error_runs} erro${data.error_runs > 1 ? "s" : ""} (${(data.error_rate * 100).toFixed(1)}%)`
            : "Nenhum erro"
        }
      />
      <CostCard
        title="Tokens Totais"
        value={formatTokens(data?.total_tokens)}
        icon={Cpu}
        description={`Prompt: ${formatTokens(data?.total_prompt_tokens)} | Completion: ${formatTokens(data?.total_completion_tokens)}`}
      />
      <CostCard
        title="Duracao Media"
        value={
          data?.avg_duration_ms
            ? `${(data.avg_duration_ms / 1000).toFixed(1)}s`
            : "-"
        }
        icon={Zap}
        description="Tempo medio por execucao"
      />
      <CostCard
        title="Agente Mais Caro"
        value={mostExpensive?.agent ?? "-"}
        icon={Hash}
        description={
          mostExpensive
            ? `${formatUsd(mostExpensive.cost_usd)} em ${mostExpensive.runs} runs`
            : undefined
        }
      />
      <CostCard
        title="Custo Desconhecido"
        value={String(data?.unknown_cost_runs ?? 0)}
        icon={AlertTriangle}
        description="Runs sem tokens retornados"
      />
    </div>
  );
}
