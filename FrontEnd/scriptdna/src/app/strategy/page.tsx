"use client";

import { useInternalTrends, useGenerateWeeklyStrategy } from "@/hooks/use-strategy";
import { TrendCards } from "@/components/strategy/trend-cards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StrategyPage() {
  const trends = useInternalTrends();
  const generateWeekly = useGenerateWeeklyStrategy();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estrategia</h1>
          <p className="text-muted-foreground">
            Tendencias internas e relatorio estrategico semanal.
          </p>
        </div>
        <Button
          onClick={() => generateWeekly.mutate()}
          disabled={generateWeekly.isPending}
        >
          {generateWeekly.isPending ? "Gerando..." : "Gerar Relatorio Semanal"}
        </Button>
      </div>

      {generateWeekly.isSuccess && (
        <Card>
          <CardHeader>
            <CardTitle>Relatorio Enviado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O relatorio estrategico semanal esta sendo gerado. Acompanhe o progresso na aba de tarefas.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Task ID: {(generateWeekly.data as { data: { task_id: string } })?.data?.task_id}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">Tendencias Internas</h2>
        <TrendCards
          data={trends.data}
          isLoading={trends.isLoading}
          isError={trends.isError}
        />
      </div>
    </div>
  );
}
