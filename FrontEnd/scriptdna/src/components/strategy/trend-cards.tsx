"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from "lucide-react";
import type { InternalTrend } from "@/types/api";

const METRIC_LABELS: Record<string, string> = {
  views: "Views",
  engagement_rate: "Engajamento",
  retention: "Retencao",
};

export function TrendCards({
  data,
  isLoading,
  isError,
}: {
  data: InternalTrend[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar tendencias</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <Minus className="mx-auto mb-2 h-8 w-8" />
          <p>Nenhuma tendencia detectada</p>
          <p className="text-sm">Dados insuficientes para analise de tendencia</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((trend) => {
        const isUp = trend.direction === "up";
        const Icon = isUp ? TrendingUp : TrendingDown;
        const color = isUp ? "text-green-600" : "text-red-600";

        return (
          <Card key={trend.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Icon className={`h-4 w-4 ${color}`} />
                {METRIC_LABELS[trend.metric] || trend.metric}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>
                {isUp ? "+" : ""}
                {trend.change_percent.toFixed(1)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Atual: {trend.recent_value} | Media anterior: {trend.baseline_avg}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
