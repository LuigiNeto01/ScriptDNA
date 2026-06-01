"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, MinusCircle, XCircle } from "lucide-react";
import type { HealthCheckItem, HealthDetailedResponse } from "@/types/api";

const checkLabels: Record<string, string> = {
  database: "Banco de dados",
  redis: "Redis",
  celery_broker: "Celery Broker",
  openai_config: "OpenAI / LLM",
  youtube_config: "YouTube OAuth",
};

function StatusIcon({ status }: { status: HealthCheckItem["status"] }) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "missing":
      return <MinusCircle className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function statusLabel(status: HealthCheckItem["status"]): string {
  switch (status) {
    case "ok":
      return "Operacional";
    case "error":
      return "Erro";
    case "missing":
      return "Nao configurado";
    default:
      return "Desconhecido";
  }
}

function statusBadgeVariant(
  status: HealthCheckItem["status"]
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "ok":
      return "default";
    case "error":
      return "destructive";
    case "missing":
      return "outline";
    default:
      return "secondary";
  }
}

export function SystemHealthStatus({
  data,
  isLoading,
  isError,
}: {
  data: HealthDetailedResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Verifica configuracao e conectividade dos servicos.
              Nao testa APIs externas para evitar custos.
            </CardDescription>
          </div>
          {data && (
            <Badge
              variant={data.status === "ok" ? "default" : "destructive"}
              className="text-sm"
            >
              {data.status === "ok" ? "Todos OK" : "Degradado"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao verificar status do sistema</span>
          </div>
        ) : data ? (
          <div className="space-y-3" data-testid="health-checks">
            {Object.entries(data.checks).map(([key, check]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-3"
                data-testid={`health-check-${key}`}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={check.status} />
                  <div>
                    <p className="text-sm font-medium">
                      {checkLabels[key] ?? key}
                    </p>
                    {check.detail && (
                      <p className="mt-0.5 max-w-[400px] truncate text-xs text-muted-foreground">
                        {check.detail}
                      </p>
                    )}
                    {check.status === "missing" && (
                      <p className="mt-0.5 text-xs text-yellow-600">
                        Configurado no .env mas nao testado contra o servico real
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={statusBadgeVariant(check.status)}>
                  {statusLabel(check.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
