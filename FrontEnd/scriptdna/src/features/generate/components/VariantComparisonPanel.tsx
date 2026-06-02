"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Copy, Eye, Sparkles, Zap } from "lucide-react";
import { copyScriptLines } from "../utils/generate-copy";
import type { GeneratedVariant } from "@/types/api";

interface VariantCardProps {
  variant: GeneratedVariant;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: (variant: GeneratedVariant) => void;
}

function VariantCard({ variant, isRecommended, isSelected, onSelect }: VariantCardProps) {
  const [copied, setCopied] = useState(false);
  const hookPct = Math.round(variant.analysis.hook_strength * 100);
  const scorePct = Math.round(variant.score * 100);
  const scoreColor =
    scorePct >= 70 ? "bg-green-500" : scorePct >= 40 ? "bg-yellow-500" : "bg-red-500";

  const handleCopy = async () => {
    await copyScriptLines(variant.lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={
        isSelected
          ? "border-primary shadow-sm"
          : isRecommended
            ? "border-primary/50"
            : ""
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">Variante {variant.variant_id}</CardTitle>
          {isRecommended && (
            <Badge className="gap-1 text-xs shrink-0">
              <Sparkles className="h-3 w-3" />
              Recomendada pela IA
            </Badge>
          )}
        </div>
        {variant.angle && (
          <p className="text-xs text-muted-foreground leading-relaxed">{variant.angle}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score geral */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor}`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold tabular-nums">{scorePct}%</span>
        </div>

        {/* Quality scores grid */}
        {variant.quality_evaluation && (
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {(
              [
                ["Abertura", variant.quality_evaluation.scores.hook],
                ["Retenção", variant.quality_evaluation.scores.retention],
                ["Clareza", variant.quality_evaluation.scores.clarity],
                ["CTA", variant.quality_evaluation.scores.cta],
              ] as [string, number | undefined | null][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between rounded border px-2 py-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">
                  {value != null ? `${Math.round(value * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hook strength */}
        <div className="flex items-center gap-2 text-xs">
          <Zap
            className={`h-3.5 w-3.5 ${
              hookPct >= 70
                ? "text-green-500"
                : hookPct >= 40
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          />
          <span className="text-muted-foreground">Força do gancho:</span>
          <span className="font-medium">{hookPct}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            className="flex-1 text-xs"
            onClick={() => onSelect(variant)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Ver roteiro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface VariantComparisonPanelProps {
  variants: GeneratedVariant[];
  recommendedVariant?: number;
  selectedVariantId?: number | null;
  onSelect: (variant: GeneratedVariant) => void;
}

export function VariantComparisonPanel({
  variants,
  recommendedVariant,
  selectedVariantId,
  onSelect,
}: VariantComparisonPanelProps) {
  return (
    <div className="space-y-4" data-testid="variant-comparison">
      <div>
        <h3 className="text-base font-semibold">Comparar variantes</h3>
        <p className="text-sm text-muted-foreground">
          Clique em{" "}
          <span className="font-medium text-foreground">Ver roteiro</span> para visualizar
          uma versão completa.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {variants.map((variant) => (
          <VariantCard
            key={variant.variant_id}
            variant={variant}
            isRecommended={variant.variant_id === recommendedVariant}
            isSelected={variant.variant_id === selectedVariantId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
