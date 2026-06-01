"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScriptAnalysis } from "@/types/api";

type Snapshot = {
  insight_ids?: string[];
  reference_ids?: string[];
  patterns_applied?: string[];
  patterns_avoided?: string[];
  quality_score?: number;
  variant_id?: number;
  context_summary?: Record<string, number>;
};

export function WhyThisScript({
  snapshot,
  analysis,
}: {
  snapshot?: unknown;
  analysis?: ScriptAnalysis | null;
}) {
  const data = snapshot as Snapshot | null | undefined;

  if (!data && !analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por que a IA gerou este roteiro?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data?.quality_score != null && (
          <div className="flex items-center justify-between rounded-md bg-accent p-3">
            <span className="text-muted-foreground">Qualidade inicial estimada</span>
            <strong>{Math.round(data.quality_score * 100)}%</strong>
          </div>
        )}
        {data?.variant_id && (
          <Badge variant="outline">Variante escolhida: {data.variant_id}</Badge>
        )}
        <InfoList title="Insights usados" items={data?.insight_ids} empty="Nenhum insight rastreado" />
        <InfoList title="Referencias usadas" items={data?.reference_ids} empty="Nenhuma referencia rastreada" />
        <InfoList
          title="Padroes aplicados"
          items={data?.patterns_applied ?? analysis?.patterns_applied}
          empty="Sem padroes aplicados registrados"
        />
        <InfoList
          title="Padroes evitados"
          items={data?.patterns_avoided ?? analysis?.patterns_avoided}
          empty="Sem anti-padroes registrados"
        />
        <InfoList
          title="Riscos previstos"
          items={analysis?.predicted_retention_risks}
          empty="Sem riscos previstos"
        />
      </CardContent>
    </Card>
  );
}

function InfoList({
  title,
  items,
  empty,
}: {
  title: string;
  items?: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      {items?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {items.slice(0, 8).map((item, index) => (
            <Badge key={`${item}-${index}`} variant="secondary" className="max-w-full truncate">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
