"use client";

import { useInternalTrends, useGenerateWeeklyStrategy } from "@/hooks/use-strategy";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { StrategyPageHeader } from "@/features/strategy/components/StrategyPageHeader";
import { WeeklyStrategyPanel } from "@/features/strategy/components/WeeklyStrategyPanel";
import { TrendCard } from "@/features/strategy/components/TrendCard";
import { StrategyEmptyState } from "@/features/strategy/components/StrategyEmptyState";

export default function StrategyPage() {
  const trends = useInternalTrends();
  const generateWeekly = useGenerateWeeklyStrategy();

  const taskId = (
    generateWeekly.data as { data: { task_id: string } } | undefined
  )?.data?.task_id;

  return (
    <div className="space-y-8">
      <StrategyPageHeader
        onGenerate={() => generateWeekly.mutate()}
        isGenerating={generateWeekly.isPending}
      />

      <WeeklyStrategyPanel taskId={taskId} isSuccess={generateWeekly.isSuccess} />

      <div>
        <h2 className="mb-2 text-xl font-semibold">Tendências do canal</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Métricas em movimento nos seus Shorts mais recentes vs. a média anterior.
        </p>

        {trends.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : trends.isError ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar tendências</span>
            </CardContent>
          </Card>
        ) : !trends.data?.length ? (
          <StrategyEmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="trends-grid">
            {trends.data.map((trend) => (
              <TrendCard key={trend.metric} trend={trend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
