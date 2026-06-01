"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BeatScores } from "@/types/api";

const BEAT_LABELS: Record<string, string> = {
  hook: "Abertura",
  setup: "Preparacao",
  conflict: "Conflito",
  escalation: "Escalada",
  payoff: "Entrega",
  cta: "Chamada para acao",
};

export function BeatScoreCard({ scores }: { scores?: BeatScores | null }) {
  const entries = Object.entries(BEAT_LABELS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance por momento narrativo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([key, label]) => {
          const score = scores?.[key as keyof BeatScores];
          const percent = score == null ? null : Math.round(score * 100);
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{label}</span>
                {percent == null ? (
                  <Badge variant="outline">Sem dado</Badge>
                ) : (
                  <span className="text-sm font-semibold">{percent}%</span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percent ?? 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
