"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TermTooltip } from "@/components/help/term-tooltip";
import type { ScriptAnalysis } from "@/types/api";

type Snapshot = {
  insight_ids?: string[];
  reference_ids?: string[];
  patterns_applied?: string[];
  patterns_avoided?: string[];
  quality_score?: number;
  variant_id?: number;
};

interface ScriptContextExplanationProps {
  snapshot?: unknown;
  analysis?: ScriptAnalysis | null;
}

export function ScriptContextExplanation({
  snapshot,
  analysis,
}: ScriptContextExplanationProps) {
  const data = snapshot as Snapshot | null | undefined;

  if (!data && !analysis) return null;

  return (
    <Card data-testid="script-context-explanation">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Por que a IA gerou este roteiro?
          <TermTooltip term="Por que a IA gerou isso?" variant="icon-only">
            Mostra os padrões, referências e insights que a IA usou ao criar este roteiro, e o
            score de qualidade estimado no momento da geração.
          </TermTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data?.quality_score != null && (
          <div className="flex items-center justify-between rounded-md bg-accent p-3">
            <span className="text-muted-foreground">Qualidade estimada ao gerar</span>
            <strong>{Math.round(data.quality_score * 100)}%</strong>
          </div>
        )}
        {data?.variant_id != null && (
          <Badge variant="outline">Variante escolhida: {data.variant_id}</Badge>
        )}
        <InfoList
          title="Insights usados"
          items={data?.insight_ids}
          empty="Nenhum insight rastreado"
        />
        <InfoList
          title="Referências usadas"
          items={data?.reference_ids}
          empty="Nenhuma referência rastreada"
        />
        <InfoList
          title="Padrões aplicados"
          items={data?.patterns_applied ?? (analysis?.patterns_applied as string[] | undefined)}
          empty="Sem padrões aplicados registrados"
        />
        <InfoList
          title="Padrões evitados"
          items={data?.patterns_avoided ?? (analysis?.patterns_avoided as string[] | undefined)}
          empty="Sem anti-padrões registrados"
        />
        <InfoList
          title="Riscos previstos"
          items={analysis?.predicted_retention_risks as string[] | undefined}
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
