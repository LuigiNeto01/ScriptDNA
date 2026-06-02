"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskProgress } from "@/components/feedback/task-progress";
import { BarChart3, FileText, Loader2, PenTool, RefreshCw, Sparkles } from "lucide-react";
import type { TaskStatus } from "@/types/api";

export function ShortActionPanel({
  scriptId,
  hasTranscript,
  onFetchMetrics,
  onFetchTranscript,
  onAnalyze,
  isFetchingMetrics,
  isFetchingTranscript,
  isAnalyzing,
  metricsTask,
  analysisTask,
}: {
  scriptId: string | null;
  hasTranscript: boolean;
  onFetchMetrics: () => void;
  onFetchTranscript: () => void;
  onAnalyze: () => void;
  isFetchingMetrics: boolean;
  isFetchingTranscript: boolean;
  isAnalyzing: boolean;
  metricsTask?: TaskStatus;
  analysisTask?: TaskStatus;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acoes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Button variant="outline" onClick={onFetchMetrics} disabled={isFetchingMetrics}>
            {isFetchingMetrics ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar metricas
          </Button>
          <Button variant="outline" onClick={onFetchTranscript} disabled={isFetchingTranscript || hasTranscript}>
            {isFetchingTranscript ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {hasTranscript ? "Transcricao pronta" : "Buscar transcricao"}
          </Button>
          <Button variant="outline" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analisar desempenho
          </Button>
          {scriptId ? (
            <Link href={`/scripts/${scriptId}`}>
              <Button variant="outline" className="w-full">
                <PenTool className="h-4 w-4" />
                Ver roteiro
              </Button>
            </Link>
          ) : (
            <Link href="/scripts">
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4" />
                Vincular roteiro
              </Button>
            </Link>
          )}
        </div>

        {metricsTask && (
          <TaskProgress
            status={metricsTask.status}
            currentStep={metricsTask.current_step}
            error={metricsTask.error}
            message="Estamos atualizando as metricas deste Short."
          />
        )}
        {analysisTask && (
          <TaskProgress
            status={analysisTask.status}
            currentStep={analysisTask.current_step}
            error={analysisTask.error}
            message="Estamos analisando seu Short. Quando terminar, voce vera pontos fortes, quedas de retencao e aprendizados."
          />
        )}
      </CardContent>
    </Card>
  );
}
