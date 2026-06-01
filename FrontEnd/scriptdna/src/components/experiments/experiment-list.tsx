"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, FlaskConical } from "lucide-react";
import type { ScriptExperiment } from "@/types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  running: { label: "Em execucao", variant: "default" },
  completed: { label: "Concluido", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const WINNER_LABEL: Record<string, string> = {
  a: "Variante A venceu",
  b: "Variante B venceu",
  tie: "Empate",
};

export function ExperimentList({
  data,
  isLoading,
  isError,
}: {
  data: ScriptExperiment[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar experimentos</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <FlaskConical className="mx-auto mb-2 h-8 w-8" />
          <p>Nenhum experimento criado</p>
          <p className="text-sm">Crie um experimento A/B para comparar roteiros</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experimentos A/B</CardTitle>
        <CardDescription>{data.length} experimento{data.length > 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((exp) => {
            const status = STATUS_BADGE[exp.status] || STATUS_BADGE.draft;
            return (
              <div key={exp.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{exp.name}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                {exp.hypothesis && (
                  <p className="text-sm text-muted-foreground">{exp.hypothesis}</p>
                )}
                {exp.winner && (
                  <p className="mt-1 text-sm font-medium text-green-700">
                    {WINNER_LABEL[exp.winner] || exp.winner}
                  </p>
                )}
                {exp.result_summary && (
                  <p className="mt-1 text-sm">{exp.result_summary}</p>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {exp.created_at && new Date(exp.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
