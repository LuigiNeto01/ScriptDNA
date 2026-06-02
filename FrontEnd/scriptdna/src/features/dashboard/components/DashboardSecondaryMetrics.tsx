import { MetricCard } from "@/components/ui/metric-card";
import { Clock, Palette, Sparkles, TrendingUp } from "lucide-react";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/formatters";
import type { DashboardMetrics } from "@/types/api";

interface DashboardSecondaryMetricsProps {
  metrics: DashboardMetrics;
}

export function DashboardSecondaryMetrics({ metrics }: DashboardSecondaryMetricsProps) {
  return (
    <div
      className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"
      data-testid="dashboard-secondary-metrics"
    >
      <MetricCard
        title="Estilos Criados"
        value={metrics.total_styles ?? 0}
        icon={Palette}
      />
      <MetricCard
        title="Técnica Principal"
        value={metrics.top_techniques?.[0]?.name ?? "-"}
        icon={TrendingUp}
        description={
          metrics.top_techniques?.[0]
            ? `${metrics.top_techniques[0].count} usos`
            : undefined
        }
      />
      <MetricCard
        title="Duração Média do Gancho"
        value={formatDuration(metrics.avg_hook_duration)}
        icon={Clock}
      />
      <MetricCard
        title="Views Médias"
        value={formatCompactNumber(metrics.avg_views)}
        icon={TrendingUp}
        description="Média dos Shorts"
      />
      <MetricCard
        title="Retenção Média"
        value={formatPercent(metrics.avg_retention)}
        icon={Clock}
        description="Média disponível"
      />
      <MetricCard
        title="Engajamento Médio"
        value={formatPercent(metrics.avg_engagement)}
        icon={Sparkles}
        description="Média disponível"
      />
    </div>
  );
}
