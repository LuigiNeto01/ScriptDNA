import { Loader2, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsPageHeaderProps {
  onAnalyzeChannel: () => void;
  onIdentifyPatterns: () => void;
  isPendingChannel: boolean;
  isPendingPatterns: boolean;
}

export function AnalyticsPageHeader({
  onAnalyzeChannel,
  onIdentifyPatterns,
  isPendingChannel,
  isPendingPatterns,
}: AnalyticsPageHeaderProps) {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="analytics-header"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visão geral do seu canal e conteúdo</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onAnalyzeChannel}
          disabled={isPendingChannel}
          data-testid="analytics-analyze-btn"
        >
          {isPendingChannel ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="mr-2 h-4 w-4" />
          )}
          Analisar Canal
        </Button>
        <Button
          variant="outline"
          onClick={onIdentifyPatterns}
          disabled={isPendingPatterns}
          data-testid="analytics-patterns-btn"
        >
          {isPendingPatterns ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Target className="mr-2 h-4 w-4" />
          )}
          Identificar Padrões
        </Button>
      </div>
    </div>
  );
}
