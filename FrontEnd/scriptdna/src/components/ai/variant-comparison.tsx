"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedVariant, QualityEvaluation } from "@/types/api";
import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

function pct(value?: number | null) {
  return value == null ? "-" : `${Math.round(value * 100)}%`;
}

function QualityGrid({ quality }: { quality?: QualityEvaluation | null }) {
  const scores = quality?.scores ?? {};
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Metric label="Abertura" value={pct(scores.hook)} />
      <Metric label="Retencao" value={pct(scores.retention)} />
      <Metric label="Clareza" value={pct(scores.clarity)} />
      <Metric label="CTA" value={pct(scores.cta)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

export function VariantComparison({
  variants,
  recommendedVariant,
  onSelect,
}: {
  variants: GeneratedVariant[];
  recommendedVariant?: number;
  onSelect?: (variant: GeneratedVariant) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3" data-testid="variant-comparison">
      {variants.map((variant) => {
        const recommended = variant.variant_id === recommendedVariant;
        return (
          <Card key={variant.variant_id} className={recommended ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Variante {variant.variant_id}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {variant.angle}
                  </p>
                </div>
                {recommended && (
                  <Badge>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Recomendada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md bg-accent p-3">
                <span className="text-sm text-muted-foreground">Score geral</span>
                <span className="text-lg font-bold">{pct(variant.score)}</span>
              </div>
              <QualityGrid quality={variant.quality_evaluation} />
              {!!variant.quality_evaluation?.risks && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1 font-medium text-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Riscos
                  </p>
                  <p>Copiar referencia: {pct(variant.quality_evaluation.risks.copy_reference)}</p>
                  <p>Frases longas: {pct(variant.quality_evaluation.risks.long_sentences)}</p>
                  <p>Payoff cedo: {pct(variant.quality_evaluation.risks.early_payoff)}</p>
                </div>
              )}
              {!!variant.quality_evaluation?.fix_suggestions?.length && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Sugestoes</p>
                  {variant.quality_evaluation.fix_suggestions.slice(0, 2).map((item, index) => (
                    <p key={index}>- {item}</p>
                  ))}
                </div>
              )}
              {onSelect && (
                <Button variant={recommended ? "default" : "outline"} className="w-full" onClick={() => onSelect(variant)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ver roteiro
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
