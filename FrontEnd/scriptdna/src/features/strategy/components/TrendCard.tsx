"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { formatCompactNumber } from "@/lib/formatters";
import type { InternalTrend } from "@/types/api";

const METRIC_LABELS: Record<string, string> = {
  views: "Views",
  engagement_rate: "Engajamento",
  retention: "Retenção",
  average_view_percentage: "% assistida",
  impressions_ctr: "Taxa de cliques",
  subscribers_gained: "Novos inscritos",
  likes: "Curtidas",
  comments: "Comentários",
};

interface TrendCardProps {
  trend: InternalTrend;
}

export function TrendCard({ trend }: TrendCardProps) {
  const isUp = trend.direction === "up";
  const isStable = trend.direction === "stable";
  const Icon = isStable ? Minus : isUp ? TrendingUp : TrendingDown;
  const colorClass = isStable
    ? "text-muted-foreground"
    : isUp
    ? "text-green-600"
    : "text-red-600";
  const bgClass = isStable
    ? ""
    : isUp
    ? "border-green-500/30 bg-green-500/5"
    : "border-red-500/30 bg-red-500/5";

  const metricLabel = METRIC_LABELS[trend.metric] ?? trend.metric;

  const params = new URLSearchParams();
  params.set("goal", "views");
  const generateHref = `/generate?${params.toString()}`;

  return (
    <Card className={bgClass} data-testid="trend-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className={`h-4 w-4 ${colorClass}`} />
          {metricLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className={`text-2xl font-bold ${colorClass}`}>
            {isStable ? "Estável" : `${isUp ? "+" : ""}${trend.change_percent.toFixed(1)}%`}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Recente: <strong>{formatCompactNumber(trend.recent_value)}</strong> ·{" "}
            Média anterior: <strong>{formatCompactNumber(trend.baseline_avg)}</strong>
          </p>
        </div>

        {isUp && (
          <p className="text-xs text-green-700 bg-green-100/60 rounded p-2">
            Bom momento para criar mais conteúdo nessa linha.
          </p>
        )}
        {!isUp && !isStable && (
          <p className="text-xs text-red-700 bg-red-100/60 rounded p-2">
            Experimente uma abordagem diferente para recuperar{" "}
            {metricLabel.toLowerCase()}.
          </p>
        )}

        <LinkButton
          href={generateHref}
          variant="outline"
          size="sm"
          className="w-full text-xs"
          data-testid="trend-generate-btn"
        >
          Gerar roteiro sobre isso
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </LinkButton>
      </CardContent>
    </Card>
  );
}
