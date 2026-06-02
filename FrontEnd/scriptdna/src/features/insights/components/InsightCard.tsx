"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { InsightConfidenceBadge } from "./InsightConfidenceBadge";
import { InsightEvidenceList } from "./InsightEvidenceList";
import { ToggleLeft, ToggleRight, Wand2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { ChannelInsight } from "@/types/api";

export const CATEGORY_LABELS: Record<string, string> = {
  hook: "Abertura",
  retention: "Retenção",
  cta: "Chamada para ação",
  narrative: "Estrutura do roteiro",
  topic: "Tema",
  speaking_style: "Estilo",
  timing: "Timing",
  audience: "Público",
  general: "Geral",
};

interface InsightCardProps {
  insight: ChannelInsight;
  onToggle: (id: string, is_active: boolean) => void;
  isToggling?: boolean;
}

export function InsightCard({ insight, onToggle, isToggling = false }: InsightCardProps) {
  const categoryLabel = CATEGORY_LABELS[insight.category] ?? insight.category;

  const params = new URLSearchParams();
  params.set("idea", insight.title);
  if (insight.niche) params.set("niche", insight.niche);
  const generateHref = `/generate?${params.toString()}`;

  return (
    <Card
      className={!insight.is_active ? "opacity-60" : ""}
      data-testid="insight-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{insight.title}</CardTitle>
          <Badge
            variant="outline"
            className="shrink-0 text-xs"
            data-testid="insight-category-badge"
          >
            {categoryLabel}
          </Badge>
        </div>
        <InsightConfidenceBadge confidence={insight.confidence} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            Confirmado em{" "}
            <strong>
              {insight.times_validated}{" "}
              {insight.times_validated === 1 ? "vídeo" : "vídeos"}
            </strong>
          </span>
          {insight.niche && <span>Nicho: {insight.niche}</span>}
        </div>

        {insight.evidence && insight.evidence.length > 0 && (
          <InsightEvidenceList evidence={insight.evidence} />
        )}

        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDate(insight.updated_at)}
          </span>
          <div className="flex items-center gap-2">
            {insight.is_active && (
              <LinkButton
                href={generateHref}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                data-testid="insight-apply-btn"
              >
                <Wand2 className="mr-1 h-3 w-3" />
                Aplicar em novo roteiro
              </LinkButton>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onToggle(insight.id, !insight.is_active)}
              disabled={isToggling}
              data-testid="insight-toggle-btn"
            >
              {insight.is_active ? (
                <>
                  <ToggleRight className="mr-1 h-3.5 w-3.5" /> Ativo
                </>
              ) : (
                <>
                  <ToggleLeft className="mr-1 h-3.5 w-3.5" /> Inativo
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
