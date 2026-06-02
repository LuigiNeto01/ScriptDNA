"use client";

import { useState, useMemo } from "react";
import { useInsights, useToggleInsight, useGenerateInsights } from "@/hooks/use-insights";
import { Card, CardContent } from "@/components/ui/card";
import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { InsightsPageHeader } from "@/features/insights/components/InsightsPageHeader";
import {
  InsightFilterBar,
  type SentimentGroup,
  type ConfidenceFilter,
} from "@/features/insights/components/InsightFilterBar";
import { InsightGroupSection } from "@/features/insights/components/InsightGroupSection";
import { Loader2, AlertCircle } from "lucide-react";
import type { InsightCategory } from "@/types/api";

export default function InsightsPage() {
  const [sentimentGroup, setSentimentGroup] = useState<SentimentGroup>("all");
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | "all">("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [nicheFilter, setNicheFilter] = useState("");

  const insights = useInsights({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    active_only: activeOnly,
    niche: nicheFilter.trim() || undefined,
  });
  const toggleInsight = useToggleInsight();
  const generateInsights = useGenerateInsights();

  const handleToggle = (id: string, is_active: boolean) => {
    toggleInsight.mutate({ id, is_active });
  };

  const filtered = useMemo(() => {
    const list = insights.data?.items ?? [];
    return list.filter((insight) => {
      if (sentimentGroup !== "all" && insight.sentiment !== sentimentGroup) return false;
      if (confidenceFilter === "high" && insight.confidence < 0.8) return false;
      if (
        confidenceFilter === "medium" &&
        (insight.confidence < 0.5 || insight.confidence >= 0.8)
      )
        return false;
      if (confidenceFilter === "low" && insight.confidence >= 0.5) return false;
      return true;
    });
  }, [insights.data?.items, sentimentGroup, confidenceFilter]);

  const positive = filtered.filter((i) => i.sentiment === "positive");
  const negative = filtered.filter((i) => i.sentiment === "negative");
  const neutral = filtered.filter((i) => i.sentiment === "neutral");

  return (
    <div className="space-y-6">
      <InsightsPageHeader
        onGenerate={() => generateInsights.mutate()}
        isGenerating={generateInsights.isPending}
      />

      <InsightFilterBar
        sentimentGroup={sentimentGroup}
        onSentimentGroupChange={setSentimentGroup}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        confidenceFilter={confidenceFilter}
        onConfidenceChange={setConfidenceFilter}
        nicheFilter={nicheFilter}
        onNicheChange={setNicheFilter}
      />

      {insights.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : insights.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar aprendizados</span>
          </CardContent>
        </Card>
      ) : !filtered.length ? (
        <EducationalEmptyState
          variant="no-insights"
          title="A IA ainda não tem aprendizados suficientes"
          description="Analise seus Shorts para descobrir padrões do que funciona no seu canal."
          tips={[
            "Analise pelo menos 3 Shorts para gerar os primeiros aprendizados",
            "Aprendizados ativos são usados automaticamente na geração de roteiros",
            "Você pode ativar ou desativar aprendizados individualmente",
          ]}
          action={<LinkButton href="/youtube">Analisar Shorts</LinkButton>}
        />
      ) : (
        <div className="space-y-8" data-testid="insights-grouped">
          <InsightGroupSection
            title="O que repetir"
            description="Padrões que funcionaram bem no seu canal — repita nos próximos vídeos."
            insights={positive}
            onToggle={handleToggle}
            isToggling={toggleInsight.isPending}
            colorClass="border-green-500/60 bg-green-500/5"
          />
          <InsightGroupSection
            title="O que evitar"
            description="Padrões que prejudicaram o desempenho — evite nos próximos vídeos."
            insights={negative}
            onToggle={handleToggle}
            isToggling={toggleInsight.isPending}
            colorClass="border-red-500/60 bg-red-500/5"
          />
          <InsightGroupSection
            title="Pontos de atenção"
            description="Padrões com resultados mistos — avalie caso a caso."
            insights={neutral}
            onToggle={handleToggle}
            isToggling={toggleInsight.isPending}
            colorClass="border-amber-500/60 bg-amber-500/5"
          />
        </div>
      )}
    </div>
  );
}
