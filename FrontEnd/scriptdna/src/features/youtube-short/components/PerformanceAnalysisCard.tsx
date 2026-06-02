import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceAnalysis } from "@/types/api";

export function PerformanceAnalysisCard({ analysis }: { analysis: PerformanceAnalysis | null | undefined }) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analise de desempenho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Este Short ainda nao foi analisado.</p>
          <p>A analise mostra o que funcionou, onde houve queda e quais aprendizados a IA pode usar nos proximos roteiros.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Analise de desempenho</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        <AnalysisList title="O que funcionou" items={analysis.strengths?.map((item) => item.description) ?? []} />
        <AnalysisList title="O que pode melhorar" items={analysis.weaknesses?.map((item) => item.suggestion ?? item.description) ?? []} />
        <AnalysisList title="O que a IA aprendeu" items={analysis.actionable_learnings?.map((item) => item.learning ?? item.claim ?? item.recommended_action ?? "") ?? []} />
      </CardContent>
    </Card>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.filter(Boolean).length > 0 ? (
        <ul className="space-y-2">
          {items.filter(Boolean).slice(0, 4).map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda nao ha itens suficientes.</p>
      )}
    </div>
  );
}
