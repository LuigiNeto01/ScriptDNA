import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Lightbulb, Loader2 } from "lucide-react";
import type { ChannelInsight } from "@/types/api";

const CATEGORY_SHORT: Record<string, string> = {
  hook: "Abertura",
  retention: "Retenção",
  cta: "CTA",
  narrative: "Estrutura",
  speaking_style: "Estilo",
  audience: "Público",
};

interface TopInsightsPanelProps {
  insights: ChannelInsight[];
  isLoading: boolean;
}

export function TopInsightsPanel({ insights, isLoading }: TopInsightsPanelProps) {
  return (
    <Card data-testid="top-insights-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Aprendizados Ativos</CardTitle>
            <CardDescription>O que a IA identificou no seu canal</CardDescription>
          </div>
          <LinkButton href="/insights" variant="ghost" size="sm">
            Ver todos
          </LinkButton>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !insights.length ? (
          <div className="py-6 text-center">
            <Lightbulb className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              Analise seus Shorts para gerar aprendizados.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border p-3"
                data-testid="top-insight-item"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium">{insight.title}</p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {CATEGORY_SHORT[insight.category] ?? insight.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
