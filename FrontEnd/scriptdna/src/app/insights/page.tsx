"use client";

import { useState } from "react";
import { useInsights, useToggleInsight, useGenerateInsights } from "@/hooks/use-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Loader2, AlertCircle, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import type { InsightCategory, InsightSentiment } from "@/types/api";

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  hook: "Hook",
  retention: "Retencao",
  cta: "CTA",
  narrative: "Narrativa",
  topic: "Topico",
  speaking_style: "Estilo",
  timing: "Timing",
  audience: "Audiencia",
  general: "Geral",
};

const SENTIMENT_COLORS: Record<InsightSentiment, "default" | "destructive" | "secondary"> = {
  positive: "default",
  negative: "destructive",
  neutral: "secondary",
};

const SENTIMENT_LABELS: Record<InsightSentiment, string> = {
  positive: "Positivo",
  negative: "Negativo",
  neutral: "Neutro",
};

export default function InsightsPage() {
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<InsightSentiment | "all">("all");
  const [activeOnly, setActiveOnly] = useState(true);

  const insights = useInsights({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter,
    active_only: activeOnly,
  });
  const toggleInsight = useToggleInsight();
  const generateInsights = useGenerateInsights();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">Aprendizados extraidos do seu canal</p>
        </div>
        <Button
          onClick={() => generateInsights.mutate()}
          disabled={generateInsights.isPending}
        >
          {generateInsights.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Gerar Insights
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as InsightCategory | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sentimentFilter} onValueChange={(v) => setSentimentFilter(v as InsightSentiment | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sentimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SENTIMENT_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={activeOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveOnly(!activeOnly)}
          className="h-10"
        >
          {activeOnly ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
          {activeOnly ? "Ativos" : "Todos"}
        </Button>
      </div>

      {/* Insights List */}
      {insights.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : insights.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar insights</span>
          </CardContent>
        </Card>
      ) : !insights.data?.items?.length ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhum insight encontrado"
          description="Gere insights a partir das analises de performance dos seus Shorts."
          action={
            <Button onClick={() => generateInsights.mutate()} disabled={generateInsights.isPending}>
              Gerar Insights
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.data.items.map((insight) => (
            <Card key={insight.id} className={!insight.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={SENTIMENT_COLORS[insight.sentiment]}>
                      {SENTIMENT_LABELS[insight.sentiment]}
                    </Badge>
                    <Badge variant="outline">{CATEGORY_LABELS[insight.category]}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{insight.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Confianca: <strong>{Math.round(insight.confidence * 100)}%</strong></span>
                  <span>Validado: <strong>{insight.times_validated}x</strong></span>
                  {insight.niche && <span>Nicho: {insight.niche}</span>}
                </div>

                {insight.evidence && insight.evidence.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Evidencias:</span>
                    <ul className="mt-1 space-y-0.5">
                      {insight.evidence.slice(0, 3).map((e, i) => (
                        <li key={i}>{e.metric}: {e.value}{e.context ? ` — ${e.context}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleInsight.mutate({ id: insight.id, is_active: !insight.is_active })}
                    disabled={toggleInsight.isPending}
                  >
                    {insight.is_active ? (
                      <><ToggleRight className="mr-1 h-4 w-4" /> Ativo</>
                    ) : (
                      <><ToggleLeft className="mr-1 h-4 w-4" /> Inativo</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
