"use client";

import { Badge } from "@/components/ui/badge";

interface InsightConfidenceBadgeProps {
  confidence: number;
}

export function InsightConfidenceBadge({ confidence }: InsightConfidenceBadgeProps) {
  if (confidence >= 0.8) {
    return (
      <Badge variant="default" className="text-xs" data-testid="insight-confidence-badge">
        Alta confiança
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="secondary" className="text-xs" data-testid="insight-confidence-badge">
        Confiança média
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs" data-testid="insight-confidence-badge">
      Baixa confiança
    </Badge>
  );
}
