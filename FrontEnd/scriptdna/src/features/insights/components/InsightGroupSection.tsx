"use client";

import { InsightCard } from "./InsightCard";
import type { ChannelInsight } from "@/types/api";

interface InsightGroupSectionProps {
  title: string;
  description: string;
  insights: ChannelInsight[];
  onToggle: (id: string, is_active: boolean) => void;
  isToggling?: boolean;
  colorClass?: string;
}

export function InsightGroupSection({
  title,
  description,
  insights,
  onToggle,
  isToggling = false,
  colorClass = "",
}: InsightGroupSectionProps) {
  if (!insights.length) return null;

  return (
    <div className="space-y-3" data-testid="insight-group-section">
      <div className={`rounded-lg border-l-4 pl-4 py-2 ${colorClass}`}>
        <h2 className="font-semibold text-base">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onToggle={onToggle}
            isToggling={isToggling}
          />
        ))}
      </div>
    </div>
  );
}
