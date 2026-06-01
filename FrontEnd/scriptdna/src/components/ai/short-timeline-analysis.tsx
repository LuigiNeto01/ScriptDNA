"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineAnalysis } from "@/types/api";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  youtube_analytics: "Retencao real do YouTube",
  manual: "Metrica manual",
  estimated: "Estimativa interna",
  template: "Estrutura preparada, sem metrica real",
  unknown: "Fonte desconhecida",
};

function beatLabel(value?: string | null) {
  return ({
    hook: "Abertura",
    setup: "Preparacao",
    conflict: "Conflito",
    escalation: "Escalada",
    payoff: "Entrega",
    cta: "Chamada para acao",
  } as Record<string, string>)[value ?? ""] ?? value ?? "Trecho";
}

export function ShortTimelineAnalysis({ timeline }: { timeline?: TimelineAnalysis | null }) {
  if (!timeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo inteligente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Analise temporal ainda nao disponivel para este Short.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Linha do tempo inteligente</CardTitle>
          <Badge variant="outline">
            Score {timeline.timeline_score == null ? "-" : `${Math.round(timeline.timeline_score * 100)}%`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!!timeline.retention_windows?.length && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Janelas de retencao</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {timeline.retention_windows.map((window, index) => (
                <div key={index} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{window.start_time}s - {window.end_time}s</span>
                    <Badge variant={window.source === "template" ? "outline" : "secondary"}>
                      {SOURCE_LABELS[window.source] ?? window.source}
                    </Badge>
                  </div>
                  {window.source === "template" ? (
                    <p className="mt-1 text-muted-foreground">
                      Janela pronta para dados reais, sem valor de retencao.
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      Retencao {window.retention_percentage ?? "-"}% · queda {window.drop_rate ?? "-"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!timeline.strong_moments?.length && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Momentos fortes
            </p>
            {timeline.strong_moments.map((moment, index) => (
              <div key={index} className="rounded-md border border-green-500/30 p-3 text-sm">
                <p className="font-mono text-xs text-muted-foreground">
                  {moment.start_time}s - {moment.end_time}s · {beatLabel(moment.beat_type)}
                </p>
                <p className="mt-1">{moment.reason}</p>
                {moment.related_script_line && (
                  <p className="mt-1 text-xs text-muted-foreground">{moment.related_script_line}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!!timeline.drop_moments?.length && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Pontos de queda
            </p>
            {timeline.drop_moments.map((moment, index) => (
              <div key={index} className="rounded-md border border-destructive/30 p-3 text-sm">
                <p className="font-mono text-xs text-muted-foreground">
                  {moment.start_time}s - {moment.end_time}s · {beatLabel(moment.beat_type)}
                </p>
                <p className="mt-1">{moment.possible_reason ?? moment.reason}</p>
                {moment.drop_rate != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Queda detectada: {Math.round(moment.drop_rate * 100)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!timeline.strong_moments?.length && !timeline.drop_moments?.length && (
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Ainda nao ha dados reais suficientes para destacar quedas ou picos.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
