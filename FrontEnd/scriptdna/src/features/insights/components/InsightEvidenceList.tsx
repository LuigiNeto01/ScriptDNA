"use client";

import type { InsightEvidence } from "@/types/api";

const METRIC_LABELS: Record<string, string> = {
  views: "views",
  retention: "retenção",
  engagement_rate: "engajamento",
  average_view_percentage: "% assistida",
  impressions_ctr: "CTR",
  likes: "curtidas",
  comments: "comentários",
};

interface InsightEvidenceListProps {
  evidence: InsightEvidence[];
}

export function InsightEvidenceList({ evidence }: InsightEvidenceListProps) {
  if (!evidence.length) return null;

  return (
    <div className="text-xs text-muted-foreground" data-testid="insight-evidence-list">
      <span className="font-medium">Evidências:</span>
      <ul className="mt-1 space-y-0.5">
        {evidence.slice(0, 3).map((e, i) => {
          const metricLabel = METRIC_LABELS[e.metric] ?? e.metric;
          return (
            <li key={i}>
              {metricLabel}: <strong>{e.value}</strong>
              {e.context ? ` — ${e.context}` : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
