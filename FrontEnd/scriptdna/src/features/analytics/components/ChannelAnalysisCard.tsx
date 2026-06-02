import { BarChart3, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsTaskFeedback } from "./AnalyticsTaskFeedback";
import type { TaskStatus } from "@/types/api";

function getTaskMessage(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const payload = result as { error?: string; message?: string };
  return payload.error ?? payload.message ?? null;
}

interface ChannelAnalysisCardProps {
  taskData: TaskStatus | undefined;
  isPending: boolean;
  onRun: () => void;
}

export function ChannelAnalysisCard({ taskData, isPending, onRun }: ChannelAnalysisCardProps) {
  return (
    <Card data-testid="channel-analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Análise de Canal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A análise de canal examina seus Shorts importados, identifica padrões de
          sucesso e gera sugestões de novos vídeos baseadas no que funciona melhor
          para o seu público.
        </p>
        <Button
          className="mt-4"
          onClick={onRun}
          disabled={isPending}
          data-testid="channel-analysis-run-btn"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="mr-2 h-4 w-4" />
          )}
          Executar Análise Completa
        </Button>
        {taskData && (
          <AnalyticsTaskFeedback
            status={taskData.status}
            message={
              taskData.error ??
              getTaskMessage(taskData.result) ??
              (taskData.status === "success"
                ? "Análise concluída."
                : taskData.current_step)
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
