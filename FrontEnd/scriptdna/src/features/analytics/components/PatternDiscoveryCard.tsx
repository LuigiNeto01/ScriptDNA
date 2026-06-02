import { Lightbulb, Loader2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsTaskFeedback } from "./AnalyticsTaskFeedback";
import type { TaskStatus } from "@/types/api";

function getTaskMessage(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const payload = result as { error?: string; message?: string };
  return payload.error ?? payload.message ?? null;
}

interface PatternDiscoveryCardProps {
  taskData: TaskStatus | undefined;
  isPending: boolean;
  onRun: () => void;
}

export function PatternDiscoveryCard({ taskData, isPending, onRun }: PatternDiscoveryCardProps) {
  return (
    <Card data-testid="pattern-discovery-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Identificação de Padrões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Consolida aprendizados de todas as análises de performance, valida padrões
          existentes e descobre novos insights para melhorar seus próximos
          roteiros automaticamente.
        </p>
        <Button
          className="mt-4"
          onClick={onRun}
          disabled={isPending}
          data-testid="pattern-discovery-run-btn"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Gerar Aprendizados
        </Button>
        {taskData && (
          <AnalyticsTaskFeedback
            status={taskData.status}
            message={
              taskData.error ??
              getTaskMessage(taskData.result) ??
              (taskData.status === "success"
                ? "Aprendizados gerados."
                : taskData.current_step)
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
