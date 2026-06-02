import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBeatName, formatAnalysisScore } from "@/lib/formatters";
import type { BeatScores } from "@/types/api";

const beatOrder = ["hook", "setup", "conflict", "escalation", "payoff", "cta"];

export function BeatPerformancePanel({ scores }: { scores: BeatScores | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Desempenho por parte do video</CardTitle>
      </CardHeader>
      <CardContent>
        {!scores ? (
          <p className="text-sm text-muted-foreground">Ainda nao temos desempenho por parte do video.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beatOrder.map((beat) => (
              <div key={beat} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{formatBeatName(beat)}</span>
                  <Badge variant="outline">{formatAnalysisScore(scores[beat as keyof BeatScores])}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
