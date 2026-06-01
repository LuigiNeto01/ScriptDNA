"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, Cpu, Loader2 } from "lucide-react";
import type { AiAgentRun, AgentRunStatus } from "@/types/api";

const statusConfig: Record<
  AgentRunStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  success: { label: "Sucesso", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
  running: { label: "Executando", variant: "secondary" },
};

function RunStatusBadge({ status }: { status: AgentRunStatus }) {
  const config = statusConfig[status] ?? statusConfig.success;
  return (
    <Badge variant={config.variant} data-testid="run-status-badge">
      {config.label}
    </Badge>
  );
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(value: number | null): string {
  if (value == null) return "Desconhecido";
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTokens(value: number | null): string {
  if (value == null) return "-";
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function AgentRunTable({
  data,
  isLoading,
  isError,
  title = "Execucoes de IA",
  description,
}: {
  data: AiAgentRun[] | undefined;
  isLoading: boolean;
  isError: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar execucoes</span>
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={Cpu}
            title="Nenhuma execucao registrada"
            description="As execucoes de agentes de IA aparecerao aqui conforme forem realizadas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="agent-run-table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Agente</th>
                  <th className="pb-2 pr-4 font-medium">Modelo</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Duracao</th>
                  <th className="pb-2 pr-4 font-medium">Tokens</th>
                  <th className="pb-2 pr-4 font-medium">Custo</th>
                  <th className="pb-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.map((run) => (
                  <AgentRunRow key={run.id} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentRunRow({ run }: { run: AiAgentRun }) {
  return (
    <>
      <tr className="border-b transition-colors hover:bg-muted/50" data-testid="agent-run-row">
        <td className="py-3 pr-4">
          <span className="font-medium">{run.agent_name}</span>
          {run.input_summary && (
            <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
              {run.input_summary}
            </p>
          )}
        </td>
        <td className="py-3 pr-4 text-muted-foreground">
          {run.model ?? "-"}
        </td>
        <td className="py-3 pr-4">
          <RunStatusBadge status={run.status} />
        </td>
        <td className="py-3 pr-4 tabular-nums">
          {formatDuration(run.duration_ms)}
        </td>
        <td className="py-3 pr-4 tabular-nums">
          {formatTokens(run.total_tokens)}
        </td>
        <td className="py-3 pr-4 tabular-nums">
          {formatCost(run.estimated_cost_usd)}
        </td>
        <td className="py-3 text-muted-foreground">
          {formatDate(run.created_at)}
        </td>
      </tr>
      {run.status === "error" && run.error_message && (
        <tr>
          <td colSpan={7} className="pb-3 pt-0">
            <div className="rounded bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              {run.error_message}
            </div>
          </td>
        </tr>
      )}
      {run.output_summary && run.status === "success" && (
        <tr>
          <td colSpan={7} className="pb-3 pt-0">
            <p className="max-w-[600px] truncate px-1 text-xs text-muted-foreground">
              {run.output_summary}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
