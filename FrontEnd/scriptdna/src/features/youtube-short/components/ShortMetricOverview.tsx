import { MetricCard } from "@/components/ui/metric-card";
import { formatClock, formatCompactNumber, formatPercentInt } from "@/lib/formatters";
import { BarChart3, Clock, Eye, MessageSquare, Share2, ThumbsUp, UserPlus } from "lucide-react";
import type { ShortMetrics } from "@/types/api";

export function ShortMetricOverview({ metrics }: { metrics: ShortMetrics | null | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <MetricCard icon={Eye} title="Views" value={formatCompactNumber(metrics?.views)} />
      <MetricCard icon={ThumbsUp} title="Likes" value={formatCompactNumber(metrics?.likes)} />
      <MetricCard icon={MessageSquare} title="Comentarios" value={formatCompactNumber(metrics?.comments)} />
      <MetricCard icon={Share2} title="Compartilhamentos" value={formatCompactNumber(metrics?.shares)} />
      <MetricCard icon={UserPlus} title="Inscritos ganhos" value={formatCompactNumber(metrics?.subscribers_gained)} />
      <MetricCard icon={BarChart3} title="Retencao media" value={formatPercentInt(metrics?.average_view_percentage)} />
      <MetricCard icon={Clock} title="Duracao assistida" value={metrics?.average_view_duration_seconds != null ? formatClock(metrics.average_view_duration_seconds) : "-"} />
    </div>
  );
}
