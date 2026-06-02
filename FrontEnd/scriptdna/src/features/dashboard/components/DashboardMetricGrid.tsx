import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { AlertCircle, FileText, Lightbulb, PlugZap, Video } from "lucide-react";

interface DashboardMetricGridProps {
  isLoading: boolean;
  isError: boolean;
  totalVideos: number;
  totalScripts: number;
  totalShorts: number;
  totalInsights: number;
  connected: boolean;
}

export function DashboardMetricGrid({
  isLoading,
  isError,
  totalVideos,
  totalScripts,
  totalShorts,
  totalInsights,
  connected,
}: DashboardMetricGridProps) {
  if (isError) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar métricas</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-metric-grid">
      <MetricCard
        title="Vídeos Analisados"
        value={totalVideos}
        icon={Video}
        loading={isLoading}
      />
      <MetricCard
        title="Roteiros Criados"
        value={totalScripts}
        icon={FileText}
        description="Roteiros versionados"
        loading={isLoading}
      />
      <MetricCard
        title="Shorts Importados"
        value={totalShorts}
        icon={PlugZap}
        description={connected ? "YouTube conectado" : "Canal pendente"}
        loading={isLoading}
      />
      <MetricCard
        title="Aprendizados Ativos"
        value={totalInsights}
        icon={Lightbulb}
        description="Identificados pela IA"
        loading={isLoading}
      />
    </div>
  );
}
