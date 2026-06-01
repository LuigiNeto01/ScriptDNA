"use client";

import { useState } from "react";
import { useYouTubeShorts } from "@/hooks/use-youtube";
import { useScripts } from "@/hooks/use-scripts";
import { useInsights } from "@/hooks/use-insights";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useAnalyzeChannel, useIdentifyPatterns } from "@/hooks/use-analysis";
import { useTaskStatus } from "@/hooks/use-videos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Video,
  Lightbulb,
  Sparkles,
  Loader2,
  TrendingUp,
  Target,
} from "lucide-react";

function getTaskMessage(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const payload = result as { error?: string; message?: string };
  return payload.error ?? payload.message ?? null;
}

export default function AnalyticsPage() {
  const [channelTaskId, setChannelTaskId] = useState<string | null>(null);
  const [patternsTaskId, setPatternsTaskId] = useState<string | null>(null);
  const shorts = useYouTubeShorts({ limit: 1 });
  const scripts = useScripts();
  const insights = useInsights({ active_only: true, limit: 1 });
  const suggestions = useSuggestions({ limit: 1 });
  const analyzeChannel = useAnalyzeChannel();
  const identifyPatterns = useIdentifyPatterns();
  const channelTask = useTaskStatus(channelTaskId);
  const patternsTask = useTaskStatus(patternsTaskId);

  const totalShorts = shorts.data?.total ?? 0;
  const totalScripts = scripts.data?.length ?? 0;
  const totalInsights = insights.data?.total ?? 0;
  const totalSuggestions = suggestions.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Visao geral do seu canal e conteudo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              analyzeChannel.mutate(undefined, {
                onSuccess: (res) => setChannelTaskId(res.data.task_id),
              })
            }
            disabled={analyzeChannel.isPending}
          >
            {analyzeChannel.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Analisar Canal
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              identifyPatterns.mutate(undefined, {
                onSuccess: (res) => setPatternsTaskId(res.data.task_id),
              })
            }
            disabled={identifyPatterns.isPending}
          >
            {identifyPatterns.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Target className="mr-2 h-4 w-4" />
            )}
            Identificar Padroes
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Video}
          label="Shorts Importados"
          value={totalShorts}
          description="Videos sincronizados"
        />
        <SummaryCard
          icon={FileText}
          label="Roteiros"
          value={totalScripts}
          description="Roteiros criados"
        />
        <SummaryCard
          icon={Lightbulb}
          label="Insights Ativos"
          value={totalInsights}
          description="Aprendizados do canal"
        />
        <SummaryCard
          icon={Sparkles}
          label="Sugestoes"
          value={totalSuggestions}
          description="Ideas de conteudo"
        />
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analise de Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A analise de canal examina seus Shorts importados, identifica padroes de
              sucesso e gera sugestoes de novos videos baseadas no que funciona melhor
              para o seu publico.
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                analyzeChannel.mutate(undefined, {
                  onSuccess: (res) => setChannelTaskId(res.data.task_id),
                })
              }
              disabled={analyzeChannel.isPending}
            >
              {analyzeChannel.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="mr-2 h-4 w-4" />
              )}
              Executar Analise Completa
            </Button>
            {channelTask.data && (
              <TaskFeedback
                status={channelTask.data.status}
                message={
                  channelTask.data.error ??
                  getTaskMessage(channelTask.data.result) ??
                  (channelTask.data.status === "success"
                    ? "Analise concluida."
                    : channelTask.data.current_step)
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Identificacao de Padroes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consolida insights de todas as analises de performance, valida padroes
              existentes e descobre novos aprendizados para melhorar seus proximos
              roteiros automaticamente.
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                identifyPatterns.mutate(undefined, {
                  onSuccess: (res) => setPatternsTaskId(res.data.task_id),
                })
              }
              disabled={identifyPatterns.isPending}
            >
              {identifyPatterns.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Gerar Insights
            </Button>
            {patternsTask.data && (
              <TaskFeedback
                status={patternsTask.data.status}
                message={
                  patternsTask.data.error ??
                  getTaskMessage(patternsTask.data.result) ??
                  (patternsTask.data.status === "success"
                    ? "Insights gerados."
                    : patternsTask.data.current_step)
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskFeedback({
  status,
  message,
}: {
  status: string;
  message?: string | null;
}) {
  return (
    <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="font-medium">Status: {status}</p>
      {message && <p className="mt-1 text-muted-foreground">{message}</p>}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
