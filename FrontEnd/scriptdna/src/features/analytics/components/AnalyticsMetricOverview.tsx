import { MetricCard } from "@/components/ui/metric-card";
import { FileText, Lightbulb, Sparkles, Video } from "lucide-react";

interface AnalyticsMetricOverviewProps {
  totalShorts: number;
  totalScripts: number;
  totalInsights: number;
  totalSuggestions: number;
}

export function AnalyticsMetricOverview({
  totalShorts,
  totalScripts,
  totalInsights,
  totalSuggestions,
}: AnalyticsMetricOverviewProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="analytics-metric-overview"
    >
      <MetricCard
        icon={Video}
        title="Shorts Importados"
        value={totalShorts}
        description="Vídeos sincronizados"
      />
      <MetricCard
        icon={FileText}
        title="Roteiros"
        value={totalScripts}
        description="Roteiros criados"
      />
      <MetricCard
        icon={Lightbulb}
        title="Aprendizados Ativos"
        value={totalInsights}
        description="Aprendizados do canal"
      />
      <MetricCard
        icon={Sparkles}
        title="Sugestões"
        value={totalSuggestions}
        description="Ideias de conteúdo"
      />
    </div>
  );
}
