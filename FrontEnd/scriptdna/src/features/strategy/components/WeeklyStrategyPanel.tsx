"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Clock } from "lucide-react";

interface WeeklyStrategyPanelProps {
  taskId?: string;
  isSuccess: boolean;
}

export function WeeklyStrategyPanel({ taskId, isSuccess }: WeeklyStrategyPanelProps) {
  if (!isSuccess) return null;

  return (
    <Card className="border-primary/30 bg-primary/5" data-testid="weekly-strategy-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Estratégia sendo preparada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Estamos preparando sua estratégia semanal com base nos desempenhos recentes do canal.
          Volte em alguns instantes para ver o plano completo.
        </p>
        {taskId && (
          <p className="text-xs text-muted-foreground font-mono">
            Tarefa em andamento: {taskId}
          </p>
        )}
        <LinkButton href="/insights" variant="outline" size="sm">
          Ver aprendizados do canal
        </LinkButton>
      </CardContent>
    </Card>
  );
}
