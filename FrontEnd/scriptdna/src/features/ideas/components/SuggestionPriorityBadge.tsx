"use client";

import { Badge } from "@/components/ui/badge";
import type { SuggestionCategory } from "@/types/api";

const PRIORITY_MAP: Record<
  SuggestionCategory,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  high_view_potential: { label: "Alto potencial", variant: "default" },
  high_retention_potential: { label: "Bom para retenção", variant: "default" },
  continuation: { label: "Continuação recomendada", variant: "secondary" },
  variation: { label: "Variação de tema vencedor", variant: "secondary" },
  experiment: { label: "Experimento", variant: "outline" },
  brand_reinforcement: { label: "Reforço de marca", variant: "outline" },
};

interface SuggestionPriorityBadgeProps {
  category: SuggestionCategory;
}

export function SuggestionPriorityBadge({ category }: SuggestionPriorityBadgeProps) {
  const { label, variant } = PRIORITY_MAP[category] ?? {
    label: category,
    variant: "outline" as const,
  };
  return (
    <Badge variant={variant} className="text-xs" data-testid="suggestion-priority-badge">
      {label}
    </Badge>
  );
}
